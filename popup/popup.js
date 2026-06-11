/**
 * popup.js
 * Version: 1.2.2-PROBE
 */

document.addEventListener('DOMContentLoaded', async () => {
  const spinner = document.getElementById('spinner');
  const status = document.getElementById('statusIndicator');
  const serverSel = document.getElementById('serverSel');
  const modelSel = document.getElementById('modelSel');
  const promptPreset = document.getElementById('promptPreset');
  const promptIn = document.getElementById('promptIn');
  const runBtn = document.getElementById('runBtn');
  const tpsVal = document.getElementById('tpsVal');
  const ttftVal = document.getElementById('ttftVal');
  const historyEl = document.getElementById('history');
  const outputEl = document.getElementById('output');

  const placeholder = "Compose your own prompt here.";
  promptIn.value = placeholder;

  const presets = {
    short: "Write a 4-line poem about computing.",
    long: "Write a comprehensive Python function to implement a binary search algorithm with detailed comments explaining the time complexity."
  };

  promptPreset.addEventListener('change', () => {
    if (promptPreset.value === 'custom') {
      promptIn.value = placeholder;
    } else {
      promptIn.value = presets[promptPreset.value];
    }
  });

  const toggleSpinner = (show) => { spinner.style.display = show ? 'block' : 'none'; };

  const updateHistory = (result) => {
    chrome.storage.local.get(['history'], (data) => {
      let hist = data.history || [];
      hist.unshift(result);
      hist = hist.slice(0, 5);
      chrome.storage.local.set({ history: hist });
      renderHistory(hist);
    });
  };

  const renderHistory = (hist) => {
    historyEl.innerHTML = '<strong>Recent History:</strong>';
    hist.forEach(h => {
      const displayPrompt = h.prompt.length > 20 ? h.prompt.substring(0, 20) + '...' : h.prompt;
      historyEl.innerHTML += `<div class="hist-item" title="${h.prompt}">[${displayPrompt}] ${h.tps} TPS | ${h.ttft}ms</div>`;
    });
  };

  chrome.storage.local.get(['history'], (d) => d.history && renderHistory(d.history));

  toggleSpinner(true);
  const servers = await APIClient.discoverServers();
  if (servers.length > 0) {
    servers.forEach(s => {
      let opt = document.createElement('option');
      opt.value = s.baseUrl;
      opt.textContent = s.baseUrl;
      serverSel.appendChild(opt);
    });
    const models = await APIClient.listModels(serverSel.value);
    models.forEach(m => {
      let opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      modelSel.appendChild(opt);
    });
    document.getElementById('controls').style.display = 'block';
    status.textContent = "Ready";
    status.className = "status-badge ready";
  } else {
    status.textContent = "No Servers Found";
  }
  toggleSpinner(false);

  runBtn.addEventListener('click', async () => {
    if(!promptIn.value || promptIn.value === placeholder) return alert("Prompt cannot be empty.");
    runBtn.disabled = true;
    toggleSpinner(true);
    status.textContent = "Benchmarking...";
    status.className = "status-badge loading";
    
    outputEl.textContent = ""; 
    let fullResponse = "";
    const startTime = Date.now();
    let firstTokenTime = 0, tokens = 0;

    await APIClient.streamCompletion(serverSel.value, {
      model: modelSel.value,
      messages: [{ role: "user", content: promptIn.value }],
      stream: true
    }, (t) => firstTokenTime = t, 
    (chunk) => { 
      // Filter out raw metadata and display only content
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.replace('data: ', '').trim();
          if (payload === '[DONE]') continue;
          
          try {
            const json = JSON.parse(payload);
            if (json.choices && json.choices[0].delta.content) {
              const content = json.choices[0].delta.content;
              fullResponse += content;
              tokens++;
            }
          } catch (e) {
            // Ignore non-parseable chunks
          }
        }
      }
      outputEl.textContent = fullResponse;
    }, () => {
      const tps = (tokens / ((Date.now() - startTime) / 1000)).toFixed(2);
      const ttft = (firstTokenTime - startTime);
      
      tpsVal.textContent = tps;
      ttftVal.textContent = ttft + 'ms';
      updateHistory({ tps, ttft, prompt: promptIn.value });
      
      runBtn.disabled = false;
      toggleSpinner(false);
      status.textContent = "Ready";
      status.className = "status-badge ready";
    });
  });
});