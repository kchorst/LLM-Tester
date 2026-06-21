# LLM Tester v2.1.0 beta — PM smoke test

## Bored PM smoke test

1. Load unpacked extension from the `LLMTester_v2.1.0_beta` folder.
2. Open popup with no local LLM running.
   - Expected: scanning first, then **No LLM found** and small **Refresh** button.
   - Expected: no prompt field and no TPS/TTFT metrics.
3. Start a local LLM server such as Ollama or LM Studio.
4. Click **Refresh**.
   - Expected: model and server appear.
   - Expected: prompt field is still hidden.
5. Click **Run test prompt**.
   - Expected: prompt appears and can be hidden again.
6. Type a short prompt and press Enter.
   - Expected: result appears.
   - Expected: TPS and TTFT appear only after the run.
7. Close and reopen popup.
   - Expected: last model/server appears immediately, then quiet rescan happens.
8. Open **Advanced**.
   - Expected: diagnostics are hidden until opened and can be hidden again.
   - Expected: no raw prompt or response text appears in diagnostics.

## Bridge sanity

- The only run-complete event should be `LLM_TESTER_RUN_COMPLETE`.
- Event is sent by background, not directly by popup UI.
- Payload must not include raw prompt, raw response, user documents, files, secrets, or local paths.
- If Sentinel+ is not installed/running, LLM Tester should still work without visible user-facing bridge errors.
