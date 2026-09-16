const repository = require('../config/repository');
const { generateEmbedding } = require('./ollama.service');

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateKeywordScore(query, text) {
  if (!query || !text) return 0;
  const queryTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTokens.length === 0) return 0.1;

  const targetText = text.toLowerCase();
  let matches = 0;
  for (const token of queryTokens) {
    const regex = new RegExp(`\\b${token}`, 'gi');
    const count = (targetText.match(regex) || []).length;
    matches += Math.min(count, 3);
  }

  return Math.min(matches / (queryTokens.length * 2), 1.0);
}

async function retrieveChunks(workspaceId, query, options = {}) {
  const topK = options.topK || 5;
  const documentIds = options.documentIds || null;
  const userId = options.userId;

  const filter = { workspaceId };
  if (userId) filter.userId = userId;

  // 1. Fetch chunks
  let chunks = await repository.getAll('document_chunks', filter);

  // Filter by documentIds if specified
  if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
    const docIdSet = new Set(documentIds.map(String));
    chunks = chunks.filter((c) => docIdSet.has(String(c.documentId)));
  }

  if (chunks.length === 0) {
    return [];
  }

  // 2. Fetch documents for names
  const documents = await repository.getAll('documents', filter);
  const docNameMap = new Map();
  for (const doc of documents) {
    docNameMap.set(String(doc.id || doc._id), doc.originalName);
  }

  // 3. Try embedding-based similarity
  let queryEmbedding = null;
  if (query && query.trim().length > 0) {
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (err) {
      queryEmbedding = null;
    }
  }

  // 4. Score each chunk
  const scoredChunks = chunks.map((chunk) => {
    let score = 0;
    const hasChunkEmbedding = Array.isArray(chunk.embedding) && chunk.embedding.length > 0;

    if (queryEmbedding && hasChunkEmbedding) {
      const vectorScore = cosineSimilarity(queryEmbedding, chunk.embedding);
      const keywordScore = calculateKeywordScore(query, chunk.text);
      score = vectorScore * 0.8 + keywordScore * 0.2;
    } else {
      score = calculateKeywordScore(query, chunk.text);
    }

    const docId = String(chunk.documentId);
    const docName = docNameMap.get(docId) || 'Unknown Document';
    const snippet =
      chunk.text.length > 250
        ? chunk.text.slice(0, 247).trim() + '...'
        : chunk.text;

    return {
      chunkId: String(chunk.id || chunk._id),
      documentId: docId,
      documentName: docName,
      text: chunk.text,
      snippet,
      score: Number(score.toFixed(4)),
    };
  });

  // 5. Sort descending by score and pick top K
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}

module.exports = {
  retrieveChunks,
  cosineSimilarity,
  calculateKeywordScore,
};
