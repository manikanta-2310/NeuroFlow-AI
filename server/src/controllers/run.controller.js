const repository = require('../config/repository');
const { httpError } = require('../utils/errors');
const { executeWorkflowPipeline } = require('../agents/pipeline');

const runController = {
  async listByWorkspace(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const runs = await repository.getAll(
      'workflow_runs',
      { workspaceId, userId },
      { createdAt: -1 }
    );

    res.json(runs);
  },

  async getById(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    const run = await repository.getById('workflow_runs', id);
    if (!run || String(run.userId) !== String(userId)) {
      throw httpError(404, 'Workflow run not found');
    }

    // Attach workspace metadata
    const workspace = await repository.getById('workspaces', run.workspaceId);

    res.json({
      ...run,
      workspaceName: workspace ? workspace.name : 'Unknown Workspace',
      workspaceColor: workspace ? workspace.color : '#6366f1',
    });
  },

  async triggerSummarize(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;
    const { prompt } = req.body;

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const run = await executeWorkflowPipeline({
      userId,
      workspaceId,
      type: 'summarize',
      input: { prompt: prompt || '' },
      title: 'Summarize Workspace',
    });

    res.status(201).json(run);
  },

  async triggerCompare(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;
    const { documentIds, prompt } = req.body;

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
      throw httpError(400, 'Comparison requires at least two selected documents');
    }

    const run = await executeWorkflowPipeline({
      userId,
      workspaceId,
      type: 'compare',
      input: { documentIds, prompt: prompt || '' },
      title: 'Compare Documents',
    });

    res.status(201).json(run);
  },

  async triggerMeetingActionItems(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;
    const { documentIds, prompt } = req.body;

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const run = await executeWorkflowPipeline({
      userId,
      workspaceId,
      type: 'meeting_action_items',
      input: { documentIds: documentIds || [], prompt: prompt || '' },
      title: 'Meeting Notes -> Action Items',
    });

    res.status(201).json(run);
  },

  async triggerResearchBrief(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;
    const { topic, prompt } = req.body;

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const run = await executeWorkflowPipeline({
      userId,
      workspaceId,
      type: 'research_brief',
      input: { topic: topic || 'General Research', prompt: prompt || '' },
      title: topic ? `Research Brief: ${topic}` : 'Research Brief',
    });

    res.status(201).json(run);
  },
};

module.exports = runController;
