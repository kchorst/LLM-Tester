/**
 * apiClient.js
 * Version: 1.1.6-PROBE
 */

const APIClient = {
  async discoverServers() {
    const ports = [11434, 1234, 8080, 3000, 7860];
    const discovered = [];
    for (const port of ports) {
      const baseUrl = `http://localhost:${port}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 500);
        const response = await fetch(`${baseUrl}/v1/models`, { signal: controller.signal });
        clearTimeout(timeout);
        if (response.ok) discovered.push({ baseUrl, port });
      } catch (e) {}
    }
    return discovered;
  },

  async listModels(baseUrl) {
    try {
      const response = await fetch(`${baseUrl}/v1/models`);
      const data = await response.json();
      return (data.data && Array.isArray(data.data)) ? data.data.map(m => m.id) : [];
    } catch (e) { return []; }
  },

  async streamCompletion(baseUrl, payload, onFirstToken, onToken, onDone) {
    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let isFirst = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (isFirst) {
          onFirstToken(Date.now());
          isFirst = false;
        }
        onToken(decoder.decode(value, { stream: true }));
      }
      onDone();
    } catch (e) { console.error("Inference Error:", e); onDone(); }
  }
};