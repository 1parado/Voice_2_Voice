class STTAdapter {
  async transcribe() {
    throw new Error('STT engine not configured');
  }
}

function createSTTAdapter() {
  return new STTAdapter();
}

module.exports = { STTAdapter, createSTTAdapter };
