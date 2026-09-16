const { retrieveChunks } = require('../services/retrieval.service');

async function runRetrieverAgent({ workspaceId, userId, plan }) {
  const query = plan.retrievalQuery || '';
  const documentIds = plan.selectedDocIds && plan.selectedDocIds.length > 0 ? plan.selectedDocIds : null;

  const chunks = await retrieveChunks(workspaceId, query, {
    documentIds,
    userId,
    topK: 5,
  });

  return {
    chunks,
    retrievedCount: chunks.length,
    retrievalQuery: query,
    topScore: chunks.length > 0 ? chunks[0].score : 0,
  };
}

module.exports = { runRetrieverAgent };
