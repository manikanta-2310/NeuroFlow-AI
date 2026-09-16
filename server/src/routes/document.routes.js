const express = require('express');
const { asyncHandler } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const documentController = require('../controllers/document.controller');

// Router for /api/documents/:id
const documentRouter = express.Router();
documentRouter.use(requireAuth);
documentRouter.get('/:id', asyncHandler(documentController.getById));
documentRouter.post('/:id/reprocess', asyncHandler(documentController.reprocess));
documentRouter.delete('/:id', asyncHandler(documentController.delete));

// Router for /api/workspaces/:workspaceId/documents
const workspaceDocumentRouter = express.Router({ mergeParams: true });
workspaceDocumentRouter.use(requireAuth);
workspaceDocumentRouter.get('/', asyncHandler(documentController.listByWorkspace));
workspaceDocumentRouter.post('/upload', upload.single('file'), asyncHandler(documentController.upload));

module.exports = {
  documentRouter,
  workspaceDocumentRouter,
};
