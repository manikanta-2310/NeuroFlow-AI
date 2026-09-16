const express = require('express');
const { asyncHandler } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const workspaceController = require('../controllers/workspace.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(workspaceController.list));
router.post('/', asyncHandler(workspaceController.create));
router.get('/:id', asyncHandler(workspaceController.getById));
router.patch('/:id', asyncHandler(workspaceController.update));
router.delete('/:id', asyncHandler(workspaceController.delete));

module.exports = router;
