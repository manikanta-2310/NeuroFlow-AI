const repository = require('../config/repository');
const { httpError } = require('../utils/errors');

const workspaceController = {
  async list(req, res) {
    const userId = req.user.id;
    const workspaces = await repository.getAll('workspaces', { userId }, { createdAt: -1 });

    // Enrich with document & run counts
    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const docCount = await repository.count('documents', { workspaceId: ws.id, userId });
        const readyDocCount = await repository.count('documents', {
          workspaceId: ws.id,
          userId,
          status: 'ready',
        });
        const runCount = await repository.count('workflow_runs', { workspaceId: ws.id, userId });
        const chunkCount = await repository.count('document_chunks', { workspaceId: ws.id, userId });

        return {
          ...ws,
          documentsCount: docCount,
          readyDocumentsCount: readyDocCount,
          runsCount: runCount,
          chunksCount: chunkCount,
        };
      })
    );

    res.json(enriched);
  },

  async create(req, res) {
    const userId = req.user.id;
    const { name, description, color } = req.body;

    if (!name || name.trim().length === 0) {
      throw httpError(400, 'Workspace name is required');
    }

    const workspace = await repository.create('workspaces', {
      userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#6366f1',
    });

    res.status(201).json(workspace);
  },

  async getById(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    const workspace = await repository.getById('workspaces', id);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const docCount = await repository.count('documents', { workspaceId: id, userId });
    const readyDocCount = await repository.count('documents', {
      workspaceId: id,
      userId,
      status: 'ready',
    });
    const runCount = await repository.count('workflow_runs', { workspaceId: id, userId });
    const chunkCount = await repository.count('document_chunks', { workspaceId: id, userId });

    res.json({
      ...workspace,
      documentsCount: docCount,
      readyDocumentsCount: readyDocCount,
      runsCount: runCount,
      chunksCount: chunkCount,
    });
  },

  async update(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, color } = req.body;

    const existing = await repository.getById('workspaces', id);
    if (!existing || String(existing.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (color !== undefined) updates.color = color;

    const updated = await repository.updateById('workspaces', id, updates);
    res.json(updated);
  },

  async delete(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await repository.getById('workspaces', id);
    if (!existing || String(existing.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    // Clean up all related items
    await repository.deleteWhere('documents', { workspaceId: id, userId });
    await repository.deleteWhere('document_chunks', { workspaceId: id, userId });
    await repository.deleteWhere('workflow_runs', { workspaceId: id, userId });
    await repository.deleteWhere('chat_threads', { workspaceId: id, userId });
    await repository.deleteWhere('chat_messages', { workspaceId: id, userId });
    await repository.deleteById('workspaces', id);

    res.json({ message: 'Workspace deleted successfully', id });
  },
};

module.exports = workspaceController;
