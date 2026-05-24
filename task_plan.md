# Task Plan: Voice2Voice Turn-Based Assistant Design

## Goal
Reach a shared, implementation-ready design for a local turn-based assistant that accepts voice or text input, gets an LLM text reply, and speaks the reply with supersonic.

## Phases
- [x] Phase 1: Plan and setup
- [ ] Phase 2: Research and gather project context
- [ ] Phase 3: Walk the design tree and lock decisions
- [ ] Phase 4: Produce the implementation blueprint

## Key Questions
1. What runtime surface should v1 target?
2. How should the app connect to the LLM while supporting relay endpoints?
3. Which local STT engine should v1 use for voice input?
4. How should supersonic be invoked for TTS output?
5. What config, persistence, and error boundaries do we need?

## Decisions Made
- Interaction mode: Turn-based / half-duplex.
- Runtime surface: Local Node.js CLI program.
- LLM compatibility target: OpenAI-compatible API shape with configurable `baseURL`, `apiKey`, and `model`.
- Relay support: Must support relay/proxy endpoints, not just first-party APIs.
- LLM transport mode: The CLI calls the configurable OpenAI-compatible endpoint directly instead of depending on a mandatory local gateway process.
- LLM response mode: Wait for the full text reply, print it in the CLI, and only then invoke TTS playback.
- Input modes in v1: Both typed text and recorded voice.
- Output modes in v1: Print LLM text reply and invoke local supersonic for spoken reply.
- STT direction: Local STT for voice input, while still supporting typed text input as a first-class path.
- STT implementation strategy: Define a stable local STT adapter interface first; concrete engine integration can be added later.
- Input boundary requirement: The CLI input layer must support both typed text and STT-driven voice turns.
- CLI input contract: Start in interactive mode and let the user choose text or voice for each turn.
- TTS invocation strategy: Treat supersonic as a local external command-line tool behind a TTS adapter.
- Current TTS reality check: The existing local test uses the Python `supertonic` API to synthesize and save `output.wav`, so file-based TTS output is the confirmed working path today.
- TTS integration direction: Use a Python helper script that calls the local `supertonic` package, with Node responsible for orchestration and playback.
- Diskless playback goal: Avoid temporary audio files if possible and let Node play the synthesized audio directly.

## Errors Encountered
- Basic directory listing from the workspace returned empty output, so repository structure still needs verification by alternate inspection.
- In this terminal environment, `supersonic` is not on PATH and `python` cannot start normally, so local runtime probing is limited and the final command shape must be configurable.

## Status
**Currently in Phase 3** - Walking the design tree for the Node.js CLI implementation and locking remaining dependencies one by one.
