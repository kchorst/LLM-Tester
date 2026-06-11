# LLM Tester

**LLM Tester** is a Chrome extension designed for **benchmarking and diagnosing local LLM inference servers**.  
It provides a clean, controlled environment for measuring:

- **TTFT** (Time‑to‑First‑Token)  
- **TPS** (Tokens Per Second)  
- **Model responsiveness**  
- **Server availability**  
- **Streaming stability**  

This extension is built for developers, researchers, and engineers who need a **repeatable, browser‑based probe** for evaluating local inference stacks such as Ollama, LM Studio, custom OpenAI‑compatible servers, or any localhost LLM endpoint.

Everything runs locally. No external APIs, no telemetry, no network beyond your own machine.

---

## Features

### Local Server Discovery
- Scans common localhost ports: `11434`, `1234`, `8080`, `3000`, `7860`  
- Sends a `/v1/models` probe to detect OpenAI‑compatible servers  
- Displays all discovered servers in the UI  

### Model Enumeration
- Queries `/v1/models`  
- Extracts model IDs  
- Populates the model dropdown automatically  

### Streaming Benchmark Engine
- Uses `/v1/chat/completions` with `stream: true`  
- Measures:
  - **TTFT** (first token latency)  
  - **TPS** (tokens per second)  
- Parses SSE chunks and extracts only model output  
- Displays output in real time  

### Prompt Presets + Custom Input
- Short preset  
- Long preset  
- Custom prompt mode  

### Benchmark History
- Stores the last 5 benchmark runs in `chrome.storage.local`  
- Displays prompt preview + TPS + TTFT  

---

## How to Use It

### 1. Open the Popup
Click the **LLM Tester** toolbar icon.  
The popup loads and immediately begins scanning for local servers.

### 2. Wait for Server Discovery
If a compatible server is found:

- It appears in the **Server** dropdown  
- Its models populate the **Model** dropdown  
- Controls become visible  
- Status changes to **Ready**

If no servers respond, the popup displays **No Servers Found**.

### 3. Choose a Prompt
Select from:

- **Short preset**  
- **Long preset**  
- **Custom prompt** (type your own)

### 4. Run the Benchmark
Click **Run Test**:

- Spinner activates  
- Status changes to **Benchmarking…**  
- Output area streams tokens in real time  
- TTFT and TPS update when the stream completes  
- The run is saved to history  

### 5. Review History
The last 5 runs appear under **Recent History**, showing:

- Prompt preview  
- TPS  
- TTFT  

---

## Troubleshooting

### No servers detected
- Ensure your LLM server is running on localhost  
- Confirm it exposes `/v1/models`  
- Check CORS settings if the server blocks browser requests  
- Try ports: `11434`, `1234`, `8080`, `3000`, `7860`

### Models list is empty
- Server responded, but returned no `data[]` array  
- Server may not follow OpenAI model schema  
- Check server logs for errors  

### Benchmark never starts
- Prompt is empty  
- Server rejected the request  
- Server does not support streaming responses  

### Output is blank
- Server may not send `delta.content` tokens  
- Some servers send metadata-only chunks  
- Check server’s streaming format  

---

## Known Limitations

- Only supports **OpenAI‑compatible** `/v1/chat/completions` streaming  
- No support for non‑streaming inference  
- No cross‑origin proxying — server must allow browser requests  
- History is limited to the last 5 runs  
- No multi‑server parallel benchmarking  
- No GPU/CPU hardware metrics (server‑side only)  

---

## Architecture Overview

### manifest.json
- MV3 extension  
- Popup‑only UI  
- Uses `storage` permission for benchmark history  

### apiClient.js
Implements all backend logic:

- Localhost server discovery  
- Model enumeration  
- Streaming completion parser  
- TTFT + TPS measurement  

### popup.js
Controls the UI:

- Loads servers and models  
- Handles presets  
- Runs benchmarks  
- Streams output  
- Updates history  
- Updates status indicators  

---

## Installation (Developer Mode)

1. Clone or download the repository  
2. Open **chrome://extensions**  
3. Enable **Developer mode**  
4. Click **Load unpacked**  
5. Select the project folder  

---

## License

MIT (or your preferred license)
