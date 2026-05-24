const path = require('path');
const { spawn } = require('child_process');

function play(wavBuffer, config = {}) {
  const pythonBin = (config.tts && config.tts.python) || 'python';
  const helperPath = path.join(__dirname, '..', 'python', 'play_helper.py');

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonBin, [helperPath], {
      stdio: ['pipe', 'ignore', 'pipe']
    });

    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start playback: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Playback exited with code ${code}: ${stderr}`));
      } else {
        resolve();
      }
    });

    proc.stdin.write(wavBuffer);
    proc.stdin.end();
  });
}

module.exports = { play };
