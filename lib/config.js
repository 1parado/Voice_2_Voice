const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      'config.json not found. Copy config.example.json to config.json and fill in your settings.'
    );
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(raw);

  if (!config.baseURL) throw new Error('config.json: baseURL is required');
  if (!config.apiKey) throw new Error('config.json: apiKey is required');

  config.model = config.model || 'gpt-4o-mini';
  config.tts = config.tts || {};
  config.tts.python = config.tts.python || 'python';
  config.tts.lang = config.tts.lang || 'en';
  config.tts.voice = config.tts.voice || 'M1';

  return config;
}

module.exports = { loadConfig };
