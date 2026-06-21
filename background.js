const SENTINEL_ID = 'iifaaepbhbndbgjegphijdhebeiaoiai';
const VERSION = '2.1.0';
const PRODUCT = 'LLM Tester';
const RUN_EVENT = 'LLM_TESTER_RUN_COMPLETE';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ version: VERSION });
});

chrome.runtime.onStartup?.addListener(() => {
  chrome.storage.local.set({ version: VERSION });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const action = message?.action || message?.type;

  if (action === RUN_EVENT) {
    const metrics = sanitizeRunMetrics(message?.payload || message?.metrics || message);
    persistAndBridge(metrics, sendResponse);
    return true;
  }

  if (action === 'GET_STATUS') {
    chrome.storage.local.get(['version', 'lastMetrics', 'lastBridgeEvent', 'lastBridgeError', 'lastServer'], data => {
      sendResponse({
        ok: true,
        product: PRODUCT,
        version: VERSION,
        lastMetrics: data.lastMetrics || null,
        lastBridgeEvent: data.lastBridgeEvent || null,
        lastBridgeError: data.lastBridgeError || null,
        lastServer: summarizeServer(data.lastServer)
      });
    });
    return true;
  }

  if (action === 'PING_SENTINEL') {
    pingSentinel(sendResponse);
    return true;
  }

  return false;
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (sender.id !== SENTINEL_ID) return false;
  const action = message?.action || message?.type;

  if (action === 'PING') {
    sendResponse({ ok: true, product: PRODUCT, version: VERSION });
    return false;
  }

  if (action === 'GET_LAST_METRICS') {
    chrome.storage.local.get(['lastMetrics'], data => {
      sendResponse({ ok: true, lastMetrics: data.lastMetrics || null });
    });
    return true;
  }

  if (action === 'GET_STATUS') {
    chrome.storage.local.get(['lastMetrics', 'lastServer', 'lastBridgeEvent'], data => {
      sendResponse({
        ok: true,
        product: PRODUCT,
        version: VERSION,
        lastMetrics: data.lastMetrics || null,
        lastServer: summarizeServer(data.lastServer),
        lastBridgeEvent: data.lastBridgeEvent || null
      });
    });
    return true;
  }

  return false;
});

function persistAndBridge(metrics, sendResponse) {
  const lastBridgeEvent = {
    action: RUN_EVENT,
    timestamp: metrics.timestamp,
    status: metrics.status,
    modelName: metrics.modelName || null,
    endpointLabel: metrics.endpointLabel || null
  };

  chrome.storage.local.set({
    version: VERSION,
    lastMetrics: metrics,
    lastBridgeEvent,
    lastBridgeError: null
  }, () => {
    sendMetricsToSentinel(metrics, ok => {
      sendResponse({ ok: true, bridgedToSentinel: ok, metrics });
    });
  });
}

function sendMetricsToSentinel(metrics, done) {
  const event = {
    action: RUN_EVENT,
    source: PRODUCT,
    timestamp: metrics.timestamp,
    payload: metrics
  };

  try {
    chrome.runtime.sendMessage(SENTINEL_ID, event, response => {
      const err = chrome.runtime.lastError?.message || null;
      if (err) {
        chrome.storage.local.set({ lastBridgeError: sanitizeError(err) });
        done(false);
        return;
      }
      done(!!response || true);
    });
  } catch (error) {
    chrome.storage.local.set({ lastBridgeError: sanitizeError(error?.message || String(error)) });
    done(false);
  }
}

function pingSentinel(sendResponse) {
  try {
    chrome.runtime.sendMessage(SENTINEL_ID, { action: 'PING', source: PRODUCT }, response => {
      const ok = !chrome.runtime.lastError && !!response?.ok;
      sendResponse({ ok });
    });
  } catch {
    sendResponse({ ok: false });
  }
}

function sanitizeRunMetrics(raw = {}) {
  const timestamp = safeNumber(raw.timestamp, Date.now());
  const status = raw.status === 'failure' ? 'failure' : 'success';
  const baseUrl = safeString(raw.baseUrl || raw.endpointUrl || '');
  const host = safeString(raw.endpointHost || hostFromUrl(baseUrl));
  const label = safeString(raw.endpointLabel || host || raw.provider || 'local endpoint');

  const safe = {
    source: PRODUCT,
    timestamp,
    endpointHost: host || null,
    endpointLabel: label || null,
    modelName: safeString(raw.modelName || raw.model || '') || null,
    provider: safeString(raw.provider || raw.backend || raw.kind || '') || null,
    backend: safeString(raw.backend || raw.provider || raw.kind || '') || null,
    ttftMs: safeNullableNumber(raw.ttftMs ?? raw.ttft),
    tps: safeNullableNumber(raw.tps),
    totalTokens: safeNullableNumber(raw.totalTokens),
    durationMs: safeNullableNumber(raw.durationMs ?? raw.latencyMs),
    status
  };

  if (status === 'failure') {
    safe.sanitizedError = sanitizeError(raw.sanitizedError || raw.error || raw.message || 'Run failed');
  }

  return safe;
}

function summarizeServer(server) {
  if (!server || typeof server !== 'object') return null;
  const baseUrl = safeString(server.baseUrl || '');
  return {
    endpointHost: hostFromUrl(baseUrl),
    endpointLabel: safeString(server.endpointLabel || hostFromUrl(baseUrl) || 'local endpoint'),
    modelName: safeString(server.model || server.modelName || '') || null,
    provider: safeString(server.provider || server.kind || '') || null,
    lastSeenAt: safeNullableNumber(server.lastSeenAt)
  };
}

function hostFromUrl(value) {
  try {
    const url = new URL(value);
    return url.host;
  } catch {
    return safeString(value).replace(/^https?:\/\//, '').split('/')[0];
  }
}

function safeString(value) {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/file:\/\/[^\s]+/gi, '[local-path]')
    .replace(/[A-Za-z]:\\[^\s]+/g, '[local-path]')
    .replace(/\/Users\/[^\s]+/g, '[local-path]')
    .slice(0, 180)
    .trim();
}

function sanitizeError(value) {
  return safeString(value)
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [redacted]')
    .replace(/[A-Za-z0-9_\-.]{24,}/g, '[redacted]')
    .slice(0, 160) || 'Unknown error';
}

function safeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
