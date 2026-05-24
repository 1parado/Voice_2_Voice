const readline = require('readline');
const { loadConfig } = require('./lib/config');
const { LLMClient } = require('./lib/llm');
const { createSTTAdapter } = require('./lib/stt');
const { synthesize } = require('./lib/tts');
const { play } = require('./lib/audio');

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(`Config error: ${err.message}`);
    process.exit(1);
  }

  const llm = new LLMClient(config);
  const stt = createSTTAdapter(config);
  const messages = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('Voice2Voice — turn-based assistant');
  console.log(`Model: ${config.model} | TTS voice: ${config.tts.voice} (${config.tts.lang})`);
  console.log('Commands: [t]ext, [v]oice, [q]uit\n');

  rl.on('SIGINT', () => {
    console.log('\nbye.');
    rl.close();
    process.exit(0);
  });

  while (true) {
    const choice = (await prompt(rl, '> [t]ext / [v]oice / [q]uit: ')).trim().toLowerCase();

    if (choice === 'q' || choice === 'quit') {
      rl.close();
      return;
    }

    let userText;
    if (choice === 'v' || choice === 'voice') {
      try {
        userText = await stt.transcribe();
      } catch (err) {
        console.log(`(${err.message} — type your message instead.)\n`);
        continue;
      }
    } else if (choice === 't' || choice === 'text') {
      userText = (await prompt(rl, 'you: ')).trim();
      if (!userText) continue;
    } else {
      console.log('Unknown choice. Use t, v, or q.\n');
      continue;
    }

    messages.push({ role: 'user', content: userText });

    let reply;
    try {
      reply = await llm.chat(messages);
    } catch (err) {
      console.error(`LLM error: ${err.message}\n`);
      messages.pop();
      continue;
    }

    messages.push({ role: 'assistant', content: reply });
    console.log(`assistant: ${reply}\n`);

    try {
      const wav = await synthesize(reply, config);
      if (!wav || wav.length === 0) {
        console.error('TTS returned empty audio, skipping playback.\n');
      } else {
        console.log(`[audio: ${wav.length} bytes]`);
        await play(wav, config);
      }
    } catch (err) {
      console.error(`TTS/playback error: ${err.message}\n`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
