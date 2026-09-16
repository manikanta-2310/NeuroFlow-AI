const fs = require('fs').promises;
const path = require('path');
const config = require('../config/env');
const repository = require('../config/repository');
const { httpError } = require('../utils/errors');
const { detectFileType } = require('../middleware/upload');
const { processDocument } = require('../services/ingestion.service');

const documentController = {
  async listByWorkspace(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;

    // Verify workspace exists
    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const documents = await repository.getAll(
      'documents',
      { workspaceId, userId },
      { createdAt: -1 }
    );

    res.json(documents);
  },

  async upload(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;

    if (!req.file) {
      throw httpError(400, 'No file uploaded');
    }

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const fileType = detectFileType(req.file.originalname, req.file.mimetype);

    const doc = await repository.create('documents', {
      userId,
      workspaceId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileType,
      status: 'uploaded',
      extractedText: '',
      summary: '',
      pageCount: 1,
      metadata: {},
      processingError: '',
    });

    // Ingest asynchronously or synchronously
    processDocument(doc.id).catch((err) => {
      console.error(`[Background Ingestion Error for ${doc.id}]:`, err);
    });

    // Return the created document record immediately
    res.status(201).json(doc);
  },

  async getById(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    const doc = await repository.getById('documents', id);
    if (!doc || String(doc.userId) !== String(userId)) {
      throw httpError(404, 'Document not found');
    }

    const chunks = await repository.getAll('document_chunks', { documentId: id, userId });

    res.json({
      ...doc,
      chunks,
    });
  },

  async reprocess(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    const doc = await repository.getById('documents', id);
    if (!doc || String(doc.userId) !== String(userId)) {
      throw httpError(404, 'Document not found');
    }

    // Trigger processing
    processDocument(id).catch((err) => {
      console.error(`[Reprocess Error for ${id}]:`, err);
    });

    const updated = await repository.updateById('documents', id, {
      status: 'processing',
      processingError: '',
    });

    res.json(updated);
  },

  async delete(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    const doc = await repository.getById('documents', id);
    if (!doc || String(doc.userId) !== String(userId)) {
      throw httpError(404, 'Document not found');
    }

    // Delete stored file if exists
    try {
      const filePath = path.join(
        config.uploadsDir,
        String(doc.userId),
        String(doc.workspaceId),
        doc.storedName
      );
      await fs.unlink(filePath).catch(() => {});
    } catch (e) {
      // Ignore file delete errors
    }

    // Clean chunks
    await repository.deleteWhere('document_chunks', { documentId: id, userId });
    await repository.deleteById('documents', id);

    res.json({ message: 'Document deleted successfully', id });
  },
};

module.exports = documentController;
