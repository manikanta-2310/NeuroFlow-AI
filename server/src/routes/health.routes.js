const express = require('express');
const repository = require('../config/repository');
const config = require('../config/env');
const { checkOllamaHealth } = require('../services/ollama.service');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ollamaConnected = await checkOllamaHealth();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'NeuroFlow AI Workspace Server',
      storage: {
        mode: repository.getMode(),
      },
      ai: {
        ollamaConnected,
        chatModel: config.ollama.chatModel,
        embedModel: config.ollama.embedModel,
      },
    });
  })
);

module.exports = router;
