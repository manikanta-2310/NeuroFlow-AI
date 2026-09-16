const express = require('express');
const { asyncHandler } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const chatController = require('../controllers/chat.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', asyncHandler(chatController.getThreads));
router.get('/:threadId/messages', asyncHandler(chatController.getMessages));
router.post('/', asyncHandler(chatController.sendMessage));

module.exports = router;
