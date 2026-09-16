const path = require('path');
const config = require('../config/env');
const repository = require('../config/repository');
const { extractDocumentText } = require('./extraction.service');
const { chunkText } = require('./chunking.service');
const { generateEmbedding } = require('./ollama.service');

async function processDocument(documentId) {
  const doc = await repository.getById('documents', documentId);
  if (!doc) {
    throw new Error(`Document ${documentId} not found`);
  }

  // Update status to processing
  await repository.updateById('documents', doc.id, {
    status: 'processing',
    processingError: '',
  });

  try {
    const filePath = path.join(
      config.uploadsDir,
      String(doc.userId),
      String(doc.workspaceId),
      doc.storedName
    );

    // 1. Text extraction
    const extraction = await extractDocumentText(filePath, doc.fileType);
    if (!extraction.text || extraction.text.trim().length === 0) {
      throw new Error('Extracted text was empty or document unreadable.');
    }

    // 2. Chunking
    const rawChunks = chunkText(extraction.text, { targetSize: 1200, overlap: 200 });
    if (rawChunks.length === 0) {
      throw new Error('Failed to create searchable chunks from document text.');
    }

    // 3. Clear existing chunks for this document (for reprocess cases)
    await repository.deleteWhere('document_chunks', { documentId: doc.id });

    // 4. Generate embeddings and save chunks
    for (const chunk of rawChunks) {
      let embedding = [];
      try {
        const emb = await generateEmbedding(chunk.text);
        if (Array.isArray(emb)) embedding = emb;
      } catch (err) {
        // Embeddings optional - fallback handles it
      }

      await repository.create('document_chunks', {
        userId: doc.userId,
        workspaceId: doc.workspaceId,
        documentId: doc.id,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        tokenCountApprox: chunk.tokenCountApprox,
        embedding,
        metadata: {
          ...chunk.metadata,
          originalName: doc.originalName,
        },
      });
    }

    // 5. Update document to ready
    const updated = await repository.updateById('documents', doc.id, {
      status: 'ready',
      extractedText: extraction.text,
      summary: extraction.summary,
      pageCount: extraction.pageCount || 1,
      metadata: {
        ...doc.metadata,
        ...extraction.metadata,
        chunksCount: rawChunks.length,
      },
      processingError: '',
    });

    console.log(`[Ingestion] Document "${doc.originalName}" (${doc.id}) processed successfully into ${rawChunks.length} chunks.`);
    return updated;
  } catch (err) {
    console.error(`[Ingestion Error for doc ${doc.id}]:`, err.message);
    const failed = await repository.updateById('documents', doc.id, {
      status: 'failed',
      processingError: err.message,
    });
    return failed;
  }
}

module.exports = {
  processDocument,
};
