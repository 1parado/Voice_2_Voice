# Notes: Voice2Voice Design Interview

## Sources

### Source 1: Local OpenAPI reference project
- Path: `E:\OpenAPI`
- Key points:
  - Provides an OpenAI-compatible client driven by `baseURL`, `apiKey`, and `model`.
  - Supports both full-response and streaming chat completion calls.
  - Includes a local relay/gateway mode at `POST /v1/chat/completions`.
  - Relay mode hides the upstream API key from downstream clients.

### Source 2: User requirements
- Key points:
  - The assistant should be turn-based.
  - Input should support both voice and typing.
  - Output should include LLM text plus supersonic-spoken audio.
  - The design should support relay/proxy endpoints.

### Source 3: Local supertonic test
- Path: `E:\supervoice\test\test_tts.py`
- Key points:
  - The import is `from supertonic import TTS`.
  - The test synthesizes text with `tts.synthesize(...)`.
  - The current proven flow saves audio to `output.wav` via `tts.save_audio(...)`.
  - No direct playback call is present in the test.

## Synthesized Findings

### Confirmed technical direction
- V1 target is a local Node.js CLI program rather than a GUI or browser app.
- The program must support both typed text input and recorded voice input.
- Voice input should use a local STT path rather than a relay or hosted STT API.
- STT should be abstracted behind an adapter interface so the first concrete engine can be plugged in later.
- The CLI should start interactively and let the user choose the input source for each turn.
- The assistant reply must be shown as text and also spoken by the local supersonic installation.
- Supersonic should be invoked through a local command-line adapter rather than as an HTTP service or SDK.
- The currently verified supertonic path is file-based synthesis to `wav`; direct playback is not yet proven by the existing local test.
- The desired v1 direction is to keep TTS in a Python helper but avoid writing temporary audio files, with Node handling playback directly.
- The LLM layer should be OpenAI-compatible instead of hardcoding a single vendor.
- The CLI should call the configured compatible endpoint directly; `baseURL` may point to a relay/proxy or a local gateway if desired.
- The CLI should wait for a complete LLM reply before printing and triggering speech output.
- Relay support can be implemented either by calling the upstream compatible endpoint directly or by targeting a local gateway that itself forwards requests upstream.
- Because v1 is turn-based, we can avoid live interruption, barge-in, and incremental TTS for the first implementation.

### Locked: TTS audio handoff (Python → Node)
- Strategy: **stdout pipe** — zero temporary files.
- Python helper script calls `supertonic`, writes WAV-format audio bytes to stdout.
- Node spawns the Python process via `child_process.spawn`, collects stdout into a Buffer, then plays it.
- Playback on Node side via `speaker` npm package (accepts PCM stream) or equivalent.
- Python outputs complete WAV (with header) so Node doesn't need hardcoded sample rate / bit depth.
- Latency note: audio plays only after full synthesis completes — acceptable for v1 turn-based design.
- Verified from source code: `tts.synthesize()` returns `(wav, duration)` where `wav` is `np.ndarray` float32 shape `(1, num_samples)` and `duration` is `np.ndarray` shape `(1,)`.
- Sample rate is available via `tts.sample_rate` (loaded from model config `cfgs["ae"]["sample_rate"]`).
- Python helper must convert float32 → int16 PCM and write WAV with header to stdout using the `wave` module.

### Open decisions
- The exact local STT engine and invocation method are intentionally deferred.
