const repository = require('../config/repository');
const { runPlannerAgent } = require('./planner.agent');
const { runRetrieverAgent } = require('./retriever.agent');
const { runTaskAgent } = require('./task.agent');
const { runWriterAgent } = require('./writer.agent');
const { runEvaluatorAgent } = require('./evaluator.agent');

function getDefaultTitle(type, input) {
  switch (type) {
    case 'ask':
      return input.question ? `Ask: "${input.question.slice(0, 50)}"` : 'Ask Workspace';
    case 'summarize':
      return 'Summarize Workspace';
    case 'compare':
      return 'Compare Documents';
    case 'meeting_action_items':
      return 'Meeting Notes -> Action Items';
    case 'research_brief':
      return input.topic ? `Research Brief: ${input.topic}` : 'Workspace Research Brief';
    default:
      return `${type} workflow`;
  }
}

async function executeWorkflowPipeline({
  userId,
  workspaceId,
  type,
  input = {},
  title = null,
}) {
  const runTitle = title || getDefaultTitle(type, input);
  const startTime = Date.now();
  const trace = [];

  // 1. Create Initial WorkflowRun record in queued state
  let run = await repository.create('workflow_runs', {
    userId,
    workspaceId,
    type,
    status: 'running',
    title: runTitle,
    input,
    output: null,
    citations: [],
    evaluation: null,
    trace: [],
  });

  try {
    // Stage 1: PLANNER
    const plannerStart = Date.now();
    const documents = await repository.getAll('documents', { workspaceId, userId });
    const readyDocs = documents.filter((d) => d.status === 'ready');

    const plan = await runPlannerAgent({ type, input, documents: readyDocs });
    const plannerDuration = Date.now() - plannerStart;

    trace.push({
      stage: 'Planner',
      status: 'completed',
      timestamp: new Date(),
      durationMs: plannerDuration,
      details: {
        plan,
        availableDocumentsCount: readyDocs.length,
      },
    });

    // Stage 2: RETRIEVER
    const retrieverStart = Date.now();
    const retrievalResult = await runRetrieverAgent({
      workspaceId,
      userId,
      plan,
    });
    const retrieverDuration = Date.now() - retrieverStart;

    const retrievedChunks = retrievalResult.chunks || [];
    const citations = retrievedChunks.map((c) => ({
      documentId: c.documentId,
      documentName: c.documentName,
      chunkId: c.chunkId,
      snippet: c.snippet,
      score: c.score,
    }));

    trace.push({
      stage: 'Retriever',
      status: 'completed',
      timestamp: new Date(),
      durationMs: retrieverDuration,
      details: {
        retrievalQuery: retrievalResult.retrievalQuery,
        retrievedCount: retrievedChunks.length,
        topScore: retrievalResult.topScore,
      },
    });

    // Map docNames for task agent (e.g. for compare)
    const docNames = {};
    for (const doc of readyDocs) {
      docNames[String(doc.id || doc._id)] = doc.originalName;
    }

    // Stage 3: TASK AGENT
    const taskStart = Date.now();
    const rawTaskOutput = await runTaskAgent({
      type,
      input,
      chunks: retrievedChunks,
      docNames,
    });
    const taskDuration = Date.now() - taskStart;

    trace.push({
      stage: 'Task',
      status: 'completed',
      timestamp: new Date(),
      durationMs: taskDuration,
      details: {
        taskType: type,
        hasRawOutput: !!rawTaskOutput,
      },
    });

    // Stage 4: WRITER AGENT
    const writerStart = Date.now();
    const writerResult = await runWriterAgent({
      type,
      taskOutput: rawTaskOutput,
    });
    const writerDuration = Date.now() - writerStart;

    trace.push({
      stage: 'Writer',
      status: 'completed',
      timestamp: new Date(),
      durationMs: writerDuration,
      details: {
        schemaValid: writerResult.schemaValid,
      },
    });

    // Stage 5: EVALUATOR AGENT
    const evalStart = Date.now();
    const evaluation = await runEvaluatorAgent({
      type,
      structuredOutput: writerResult.structuredOutput,
      chunks: retrievedChunks,
      startTime,
    });
    const evalDuration = Date.now() - evalStart;

    trace.push({
      stage: 'Evaluator',
      status: 'completed',
      timestamp: new Date(),
      durationMs: evalDuration,
      details: {
        score: evaluation.score,
        confidence: evaluation.confidence,
        groundedness: evaluation.groundedness,
      },
    });

    // Update WorkflowRun to completed
    const updatedRun = await repository.updateById('workflow_runs', run.id, {
      status: 'completed',
      output: writerResult.structuredOutput,
      citations,
      evaluation,
      trace,
    });

    return updatedRun || { ...run, status: 'completed', output: writerResult.structuredOutput, citations, evaluation, trace };
  } catch (err) {
    console.error(`[Pipeline Error in ${type}]:`, err);
    trace.push({
      stage: 'Pipeline',
      status: 'failed',
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
      details: { error: err.message },
    });

    const failedRun = await repository.updateById('workflow_runs', run.id, {
      status: 'failed',
      output: { error: err.message },
      trace,
    });

    return failedRun || { ...run, status: 'failed', trace };
  }
}

module.exports = {
  executeWorkflowPipeline,
  getDefaultTitle,
};
