const express = require('express');
const { asyncHandler } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const runController = require('../controllers/run.controller');

// Root router for /api/runs/:id
const runRouter = express.Router();
runRouter.use(requireAuth);
runRouter.get('/:id', asyncHandler(runController.getById));

// Workspace-nested router for /api/workspaces/:workspaceId/runs
const workspaceRunRouter = express.Router({ mergeParams: true });
workspaceRunRouter.use(requireAuth);
workspaceRunRouter.get('/', asyncHandler(runController.listByWorkspace));
workspaceRunRouter.post('/summarize', asyncHandler(runController.triggerSummarize));
workspaceRunRouter.post('/compare', asyncHandler(runController.triggerCompare));

// Support both kebab-case and snake_case routes
workspaceRunRouter.post('/meeting-action-items', asyncHandler(runController.triggerMeetingActionItems));
workspaceRunRouter.post('/meeting_action_items', asyncHandler(runController.triggerMeetingActionItems));

workspaceRunRouter.post('/research-brief', asyncHandler(runController.triggerResearchBrief));
workspaceRunRouter.post('/research_brief', asyncHandler(runController.triggerResearchBrief));

module.exports = {
  runRouter,
  workspaceRunRouter,
};
