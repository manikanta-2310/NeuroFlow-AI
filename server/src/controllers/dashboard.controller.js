const repository = require('../config/repository');
const config = require('../config/env');
const { checkOllamaHealth } = require('../services/ollama.service');

const dashboardController = {
  async getDashboard(req, res) {
    const userId = req.user.id;

    const [
      workspacesCount,
      documentsCount,
      runsCount,
      chunksCount,
      recentWorkspaces,
      recentRuns,
      recentDocuments,
      ollamaHealthy,
    ] = await Promise.all([
      repository.count('workspaces', { userId }),
      repository.count('documents', { userId }),
      repository.count('workflow_runs', { userId }),
      repository.count('document_chunks', { userId }),
      repository.getAll('workspaces', { userId }, { updatedAt: -1 }),
      repository.getAll('workflow_runs', { userId }, { createdAt: -1 }),
      repository.getAll('documents', { userId }, { createdAt: -1 }),
      checkOllamaHealth(),
    ]);

    // Map workspace names onto runs
    const wsMap = new Map();
    for (const ws of recentWorkspaces) {
      wsMap.set(String(ws.id || ws._id), { name: ws.name, color: ws.color });
    }

    const enrichedRuns = recentRuns.slice(0, 6).map((run) => {
      const ws = wsMap.get(String(run.workspaceId)) || {
        name: 'Workspace',
        color: '#6366f1',
      };
      return {
        ...run,
        workspaceName: ws.name,
        workspaceColor: ws.color,
      };
    });

    res.json({
      metrics: {
        workspacesCount,
        documentsCount,
        runsCount,
        chunksCount,
      },
      recentWorkspaces: recentWorkspaces.slice(0, 4),
      recentRuns: enrichedRuns,
      recentDocuments: recentDocuments.slice(0, 5),
      systemStatus: {
        storageMode: repository.getMode(),
        ollamaConnected: ollamaHealthy,
        chatModel: config.ollama.chatModel,
        embedModel: config.ollama.embedModel,
      },
    });
  },
};

module.exports = dashboardController;
