const repository = require('../config/repository');
const { httpError } = require('../utils/errors');
const { executeWorkflowPipeline } = require('../agents/pipeline');

const chatController = {
  async getThreads(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const threads = await repository.getAll(
      'chat_threads',
      { workspaceId, userId },
      { updatedAt: -1 }
    );

    res.json(threads);
  },

  async getMessages(req, res) {
    const userId = req.user.id;
    const { workspaceId, threadId } = req.params;

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    const messages = await repository.getAll(
      'chat_messages',
      { workspaceId, threadId, userId },
      { createdAt: 1 }
    );

    res.json(messages);
  },

  async sendMessage(req, res) {
    const userId = req.user.id;
    const { workspaceId } = req.params;
    let { question, threadId } = req.body;

    if (!question || question.trim().length === 0) {
      throw httpError(400, 'Question content is required');
    }

    const workspace = await repository.getById('workspaces', workspaceId);
    if (!workspace || String(workspace.userId) !== String(userId)) {
      throw httpError(404, 'Workspace not found');
    }

    // 1. Get or create chat thread
    let thread = null;
    if (threadId) {
      thread = await repository.getById('chat_threads', threadId);
    }

    if (!thread) {
      thread = await repository.create('chat_threads', {
        userId,
        workspaceId,
        title: question.trim().slice(0, 40) || 'New Conversation',
      });
      threadId = thread.id;
    }

    // 2. Save user message
    const userMsg = await repository.create('chat_messages', {
      userId,
      workspaceId,
      threadId,
      role: 'user',
      content: question.trim(),
      citations: [],
    });

    // 3. Execute 5-stage Ask Workflow
    const run = await executeWorkflowPipeline({
      userId,
      workspaceId,
      type: 'ask',
      input: { question: question.trim(), threadId },
      title: `Ask: "${question.trim().slice(0, 45)}"`,
    });

    const assistantAnswer = run.output?.answer || 'No answer generated.';
    const citations = run.citations || [];

    // 4. Save assistant message with citations
    const assistantMsg = await repository.create('chat_messages', {
      userId,
      workspaceId,
      threadId,
      role: 'assistant',
      content: assistantAnswer,
      citations,
    });

    // 5. Update thread timestamp
    await repository.updateById('chat_threads', threadId, {
      updatedAt: new Date(),
    });

    res.status(201).json({
      threadId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      runId: run.id,
      citations,
    });
  },
};

module.exports = chatController;
