const { generateChatResponse } = require('../services/ollama.service');

async function runPlannerAgent({ type, input, documents = [] }) {
  const availableDocs = documents.map((d) => ({
    id: d.id || d._id,
    name: d.originalName,
    summary: d.summary || '',
  }));

  // Build query heuristics
  let query = '';
  let selectedDocIds = [];

  if (type === 'ask') {
    query = input.question || 'general question';
  } else if (type === 'summarize') {
    query = input.prompt || 'summary key points overview';
  } else if (type === 'compare') {
    selectedDocIds = input.documentIds || [];
    query = input.prompt || 'compare similarities differences key aspects';
  } else if (type === 'meeting_action_items') {
    query = input.prompt || 'action items tasks decisions follow-up TODO owner';
    if (input.documentIds) selectedDocIds = input.documentIds;
  } else if (type === 'research_brief') {
    query = input.topic || input.prompt || 'research brief analysis insights overview';
  }

  const prompt = [
    {
      role: 'system',
      content: 'You are the Planner Agent for a document intelligence system. Given the task and available documents, output a JSON object with: retrievalQuery (string), focus (string), and selectedDocIds (array of string ids). Output ONLY valid JSON.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        taskType: type,
        userInput: input,
        availableDocuments: availableDocs,
      }),
    },
  ];

  let rawResponse = await generateChatResponse(prompt, { temperature: 0.1 });
  let plan = {
    retrievalQuery: query,
    focus: `Execute ${type} analysis`,
    selectedDocIds: selectedDocIds.length > 0 ? selectedDocIds : availableDocs.map((d) => String(d.id)),
    reasoning: 'Heuristic planner routing based on workflow parameters.',
  };

  if (rawResponse) {
    try {
      const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.retrievalQuery) plan.retrievalQuery = parsed.retrievalQuery;
      if (parsed.focus) plan.focus = parsed.focus;
      if (Array.isArray(parsed.selectedDocIds) && parsed.selectedDocIds.length > 0) {
        plan.selectedDocIds = parsed.selectedDocIds;
      }
      plan.reasoning = 'LLM optimized retrieval plan.';
    } catch (e) {
      // Keep heuristic plan
    }
  }

  return plan;
}

module.exports = { runPlannerAgent };
