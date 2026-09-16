const mongoose = require('mongoose');

const WorkflowRunSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['ask', 'summarize', 'compare', 'meeting_action_items', 'research_brief'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
    },
    title: { type: String, required: true },
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: mongoose.Schema.Types.Mixed, default: null },
    citations: {
      type: [
        {
          documentId: String,
          documentName: String,
          chunkId: String,
          snippet: String,
          score: Number,
        },
      ],
      default: [],
    },
    evaluation: {
      type: {
        score: Number,
        confidence: String,
        notes: String,
        groundedness: String,
        latencyMs: Number,
      },
      default: null,
    },
    trace: {
      type: [
        {
          stage: String, // Planner, Retriever, Task, Writer, Evaluator
          status: String, // started, completed, failed, skipped
          timestamp: Date,
          durationMs: Number,
          details: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.models.WorkflowRun || mongoose.model('WorkflowRun', WorkflowRunSchema);
