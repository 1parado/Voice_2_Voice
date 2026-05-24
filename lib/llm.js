const https = require('https');
const http = require('http');
const { URL } = require('url');

class LLMClient {
  constructor(config) {
    if (!config || !config.baseURL || !config.apiKey) {
      throw new Error('Missing baseURL or apiKey in config');
    }
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini';
  }

  async chat(messages, options = {}) {
    const url = new URL(this.baseURL + '/chat/completions');
    const body = JSON.stringify({
      model: options.model || this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1500
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
        'Authorization': `Bearer ${this.apiKey}`,
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
              reject(new Error(`API Error: ${json.error.message || JSON.stringify(json.error)}`));
            } else if (json.choices && json.choices[0] && json.choices[0].message) {
              resolve(json.choices[0].message.content);
            } else {
              reject(new Error('Unexpected API response format'));
            }
          } catch (err) {
            reject(new Error(`Parse error: ${err.message}. Raw: ${data.slice(0, 200)}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(body);
      req.end();
    });
  }
}

module.exports = { LLMClient };
