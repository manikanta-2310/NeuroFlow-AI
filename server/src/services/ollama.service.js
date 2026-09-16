const config = require('../config/env');

let isOllamaAvailable = null;
let lastCheckTime = 0;
const CHECK_CACHE_MS = 10000; // 10s health check cache

async function checkOllamaHealth(force = false) {
  const now = Date.now();
  if (!force && isOllamaAvailable !== null && now - lastCheckTime < CHECK_CACHE_MS) {
    return isOllamaAvailable;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${config.ollama.baseUrl}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      isOllamaAvailable = true;
      lastCheckTime = now;
      return true;
    }
    isOllamaAvailable = false;
    lastCheckTime = now;
    return false;
  } catch (err) {
    isOllamaAvailable = false;
    lastCheckTime = now;
    return false;
  }
}

async function generateChatResponse(messages, options = {}) {
  const isHealthy = await checkOllamaHealth();
  if (!isHealthy) {
    return null;
  }

  const model = options.model || config.ollama.chatModel;
  const temperature = options.temperature !== undefined ? options.temperature : 0.2;
  const timeoutMs = options.timeoutMs || 30000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const formattedPrompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const res = await fetch(`${config.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: formattedPrompt,
        stream: false,
        options: {
          temperature,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.response ? data.response.trim() : null;
  } catch (err) {
    console.warn(`[Ollama] Chat generation failed or timed out: ${err.message}`);
    return null;
  }
}

async function generateEmbedding(text, options = {}) {
  const isHealthy = await checkOllamaHealth();
  if (!isHealthy || !text || text.trim().length === 0) {
    return null;
  }

  const model = options.model || config.ollama.embedModel;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${config.ollama.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: text.slice(0, 2000), // Protect against overly large chunk embeddings
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.embedding || null;
  } catch (err) {
    return null;
  }
}

module.exports = {
  checkOllamaHealth,
  generateChatResponse,
  generateEmbedding,
};
