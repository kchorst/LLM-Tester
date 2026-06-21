# LLM Tester v2.1.0 beta

LLM Tester scans common local LLM endpoints, shows a detected model/server, lets the user run a prompt only after choosing **Run test prompt**, and shares only safe run metrics with Sentinel+.

## Core behavior

- Opens in scanning state.
- Scans common localhost and 127.0.0.1 endpoints by default.
- If a model/server is found, the popup shows the model and server clearly.
- If no endpoint is found, the popup shows **No LLM found** and a small **Refresh** button.
- Prompt entry is hidden until the user clicks **Run test prompt**.
- Enter sends the prompt; Shift+Enter adds a line.
- TPS and TTFT appear only after a prompt run succeeds.
- The last found server/model is persisted locally.
- On reopen, the last found server/model is shown immediately while LLM Tester quietly rescans.
- Custom endpoint entry is hidden behind a small button.
- Advanced diagnostics are hidden until opened and can be hidden again.

## Sentinel+ bridge

Run-complete metrics are sent through one background-owned event:

`LLM_TESTER_RUN_COMPLETE`

Safe payload fields:

- source
- timestamp
- endpoint host / endpoint label
- model name
- provider/backend
- TTFT
- TPS
- total tokens when available or estimated
- duration
- success/failure status
- sanitized error on failure

The bridge does **not** send raw prompt text, raw response text, user documents, files, secrets, or local paths.

## Files

- `manifest.json`
- `background.js`
- `js/apiClient.js`
- `popup/popup.html`
- `popup/popup.js`
- `TEST_NOTES.md`
