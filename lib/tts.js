const https = require('https');
const http = require('http');
const { URL } = require('url');
const { spawn } = require('child_process');
const path = require('path');

const SUPERTONIC_LANGS = new Set([
  'en','ko','ja','ar','bg','cs','da','de','el','es','et','fi','fr',
  'hi','hr','hu','id','it','lt','lv','nl','pl','pt','ro','ru','sk',
  'sl','sv','tr','uk','vi','na'
]);

function synthesize(text, config) {
  const lang = config.tts.lang || 'en';

  if (SUPERTONIC_LANGS.has(lang)) {
    return synthesizeLocal(text, config);
  }
  return synthesizeRemote(text, config);
}

function synthesizeRemote(text, config) {
  const baseURL = config.baseURL.replace(/\/$/, '');
  const url = new URL(baseURL + '/chat/completions');
  const ttsModel = config.tts.model || 'mimo-v2.5-tts';

  const body = JSON.stringify({
    model: ttsModel,
    messages: [{ role: 'assistant', content: text }]
  });

  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  const reqOpts = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Length': Buffer.byteLength(body)
    },
    timeout: 60000
  };

  return new Promise((resolve, reject) => {
    const req = client.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`TTS API Error: ${json.error.message || JSON.stringify(json.error)}`));
            return;
          }
          const audioData = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.audio && json.choices[0].message.audio.data;
          if (!audioData) {
            reject(new Error('TTS API returned no audio data'));
            return;
          }
          resolve(Buffer.from(audioData, 'base64'));
        } catch (err) {
          reject(new Error(`TTS parse error: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TTS request timeout'));
    });

    req.write(body);
    req.end();
  });
}

function synthesizeLocal(text, config) {
  const pythonBin = config.tts.python || 'python';
  const lang = config.tts.lang || 'en';
  const voice = config.tts.voice || 'M1';
  const helperPath = path.join(__dirname, '..', 'python', 'tts_helper.py');

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonBin, [helperPath, lang, voice], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const chunks = [];
    let stderr = '';

    proc.stdout.on('data', (chunk) => chunks.push(chunk));
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start Python TTS: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`TTS helper exited with code ${code}: ${stderr}`));
        return;
      }
      const wavBuffer = Buffer.concat(chunks);
      if (wavBuffer.length === 0) {
        reject(new Error(`TTS produced no audio output. ${stderr}`));
        return;
      }
      resolve(wavBuffer);
    });

    proc.stdin.write(text, 'utf-8');
    proc.stdin.end();
  });
}

module.exports = { synthesize };
