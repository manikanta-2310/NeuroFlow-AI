const bcrypt = require('bcryptjs');
const repository = require('../config/repository');
const { chunkText } = require('../services/chunking.service');
const { generateSimpleSummary } = require('../services/extraction.service');

const DEMO_USER = {
  name: 'Alex Vance',
  email: 'demo@neuroflow.ai',
  password: 'Password@123',
};

const SAMPLE_DOCUMENTS = [
  {
    workspaceName: 'Autonomous AI Agent Frameworks',
    workspaceColor: '#6366f1',
    workspaceDescription: 'Research on multi-agent coordination, planner-retriever pipelines, and local LLM execution.',
    docs: [
      {
        originalName: 'agent-architecture-whitepaper.md',
        storedName: 'sample-agent-architecture.md',
        fileType: 'md',
        mimeType: 'text/markdown',
        text: `# Autonomous Agent Architecture Whitepaper
## Executive Summary
Autonomous agents represent the next evolutionary leap in document intelligence. By structuring pipelines into dedicated specialized roles—Planner, Retriever, Task Execution, Output Formatter, and Evaluator—systems achieve unprecedented reliability and explainability.

## 1. The 5-Stage Agentic Pipeline
Traditional single-prompt LLM interactions suffer from hallucination and lack of structured verifiability. Our 5-stage pipeline mitigates these failure modes:
1. **Planner Agent**: Analyzes user intent, determines whether semantic retrieval is required, constructs target search queries, and selects candidate document subsets.
2. **Retriever Agent**: Executes hybrid cosine similarity vector search and BM25 keyword scoring across pre-computed text chunks.
3. **Task Agent**: Synthesizes the retrieved domain knowledge to execute complex reasoning such as summarization, cross-document comparison, or action item extraction.
4. **Writer Agent**: Enforces strict JSON schemas and validates response formatting for downstream consumption.
5. **Evaluator Agent**: Computes groundedness scores against source citations and assigns confidence intervals before response delivery.

## 2. Local Inference & Privacy
By eliminating reliance on third-party cloud APIs, enterprises maintain total sovereign control over their sensitive data. Ollama with lightweight models like LLaMA 3.1 8B provides high-throughput inference with sub-second token generation latency.`,
      },
      {
        originalName: 'vector-retrieval-benchmark.txt',
        storedName: 'sample-retrieval-benchmark.txt',
        fileType: 'txt',
        mimeType: 'text/plain',
        text: `NEUROFLOW VECTOR RETRIEVAL BENCHMARK REPORT
Date: 2026-08-15
Evaluator: AI Infrastructure Benchmarking Group

TEST METHODOLOGY:
- Corpus Size: 10,000 document chunks (~1,200 chars each)
- Embedding Model: nomic-embed-text (768 dimensions)
- Similarity Metric: Cosine Similarity + BM25 Hybrid Weighting (80/20)

RESULTS SUMMARY:
1. Recall@5: 94.8% across technical document domain
2. Mean Latency per Query: 14.2ms (In-Memory / Local Index)
3. Fallback Keyword Overlap Accuracy: 81.3% when Ollama is offline
4. Peak Memory Consumption: <45MB for 10,000 indexed chunks

RECOMMENDATIONS:
- Retain paragraph-aware chunk boundaries with 200 character sliding overlap.
- Pre-filter chunks by workspaceId and userId before scoring to minimize compute overhead.`,
      },
    ],
  },
  {
    workspaceName: 'Executive Product Planning & Q3 Roadmap',
    workspaceColor: '#06b6d4',
    workspaceDescription: 'Quarterly strategy meetings, sprint backlog priorities, and cross-functional team deliverables.',
    docs: [
      {
        originalName: 'q3-strategy-meeting-notes.md',
        storedName: 'sample-strategy-notes.md',
        fileType: 'md',
        mimeType: 'text/markdown',
        text: `# Executive Strategy Meeting Notes - Q3 Roadmap
Date: August 28, 2026
Attendees: Sarah Chen (VP Product), David Kim (Lead Architect), Elena Rostova (Engineering Manager)

## Agenda & Discussion Notes
1. **Core Platform Milestones**: The document ingestion engine has reached v1.0 stability with support for PDF, DOCX, CSV, and OCR. We need to finalize the offline fallback mechanics before release.
2. **AI Workspace Experience**: The visual workflow graph was well received by beta testers. Enhancing the trace inspector with stage-by-stage timings is high priority.
3. **Security & Deployment**: Ensure all documents are strictly isolated by userId and workspaceId. Review JWT rotation policies.

## Action Items & Ownership
- [ ] Task: Complete end-to-end integration tests for 5-stage workflow pipeline | Owner: David Kim | Priority: High | Due: Next sprint milestone
- [ ] Task: Optimize OCR image pre-processing with sharp and tesseract.js | Owner: Engineering Team | Priority: Medium | Due: End of Month
- [ ] Task: Finalize dark-mode UI theme and interactive trace viewer | Owner: Frontend Team | Priority: High | Due: Friday
- [ ] Task: Document memory-mode fallback behavior for self-hosted instances | Owner: Sarah Chen | Priority: Normal | Due: Q3 Launch`,
      },
    ],
  },
];

async function seedDatabase() {
  try {
    // 1. Check or create demo user
    let user = await repository.getOne('users', { email: DEMO_USER.email });
    if (!user) {
      const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
      user = await repository.create('users', {
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        password: hashedPassword,
      });
      console.log(`[Seed] Demo user created: ${DEMO_USER.email}`);
    }

    const userId = String(user.id || user._id);

    // 2. Check existing workspaces for demo user
    const existingWorkspaces = await repository.getAll('workspaces', { userId });
    if (existingWorkspaces.length > 0) {
      return; // Already seeded
    }

    console.log('[Seed] Populating demo workspaces, documents, chunks, and workflow runs...');

    for (const wsData of SAMPLE_DOCUMENTS) {
      // Create workspace
      const workspace = await repository.create('workspaces', {
        userId,
        name: wsData.workspaceName,
        description: wsData.workspaceDescription,
        color: wsData.workspaceColor,
      });

      const workspaceId = String(workspace.id || workspace._id);
      const createdDocs = [];

      // Create documents and chunks
      for (const docData of wsData.docs) {
        const summary = generateSimpleSummary(docData.text);
        const doc = await repository.create('documents', {
          userId,
          workspaceId,
          originalName: docData.originalName,
          storedName: docData.storedName,
          mimeType: docData.mimeType,
          size: docData.text.length,
          fileType: docData.fileType,
          status: 'ready',
          extractedText: docData.text,
          summary,
          pageCount: 1,
          metadata: { isSample: true },
          processingError: '',
        });

        createdDocs.push(doc);

        const chunks = chunkText(docData.text, { targetSize: 1200, overlap: 200 });
        for (const chunk of chunks) {
          await repository.create('document_chunks', {
            userId,
            workspaceId,
            documentId: doc.id,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            tokenCountApprox: chunk.tokenCountApprox,
            embedding: [], // Seeded with empty embeddings for instant startup; keyword fallback handles scoring
            metadata: {
              ...chunk.metadata,
              originalName: doc.originalName,
            },
          });
        }
      }

      // Seed a sample completed WorkflowRun for this workspace
      if (wsData.workspaceName.includes('Agent Frameworks')) {
        await repository.create('workflow_runs', {
          userId,
          workspaceId,
          type: 'summarize',
          status: 'completed',
          title: 'Summarize Workspace',
          input: { prompt: 'Provide executive summary and key points.' },
          output: {
            summary:
              'Autonomous agent architectures replace fragile monolithic prompts with a disciplined 5-stage pipeline (Planner, Retriever, Task, Writer, Evaluator). This design yields high precision, explainability, and privacy-preserving local execution with sub-15ms retrieval latencies.',
            keyPoints: [
              '5-Stage Pipeline drastically reduces hallucinations through grounded citation checks.',
              'Hybrid retrieval achieves 94.8% Recall@5 with local vector cosine scoring.',
              'Local LLaMA 3.1 & nomic-embed-text models provide full offline autonomy.',
            ],
          },
          citations: [
            {
              documentId: createdDocs[0]?.id,
              documentName: 'agent-architecture-whitepaper.md',
              snippet: 'By structuring pipelines into dedicated specialized roles—Planner, Retriever, Task Execution, Output Formatter, and Evaluator...',
              score: 0.94,
            },
          ],
          evaluation: {
            score: 0.96,
            confidence: 'High',
            groundedness: 'High semantic relevance (score: 94%)',
            notes: 'Verified against 2 primary architecture specification chunks.',
            latencyMs: 340,
          },
          trace: [
            {
              stage: 'Planner',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 45,
              details: { focus: 'Executive summarization of agent framework documentation' },
            },
            {
              stage: 'Retriever',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 28,
              details: { retrievedCount: 3, topScore: 0.94 },
            },
            {
              stage: 'Task',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 160,
              details: { taskType: 'summarize' },
            },
            {
              stage: 'Writer',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 30,
              details: { schemaValid: true },
            },
            {
              stage: 'Evaluator',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 77,
              details: { score: 0.96, confidence: 'High' },
            },
          ],
        });
      } else if (wsData.workspaceName.includes('Product Planning')) {
        await repository.create('workflow_runs', {
          userId,
          workspaceId,
          type: 'meeting_action_items',
          status: 'completed',
          title: 'Meeting Notes -> Action Items',
          input: { prompt: 'Extract all action items and assignees.' },
          output: {
            summary: 'Extracted 4 actionable deliverables from the Q3 Strategy Meeting transcript.',
            actionItems: [
              {
                task: 'Complete end-to-end integration tests for 5-stage workflow pipeline',
                owner: 'David Kim',
                priority: 'High',
                dueNote: 'Next sprint milestone',
              },
              {
                task: 'Optimize OCR image pre-processing with sharp and tesseract.js',
                owner: 'Engineering Team',
                priority: 'Medium',
                dueNote: 'End of Month',
              },
              {
                task: 'Finalize dark-mode UI theme and interactive trace viewer',
                owner: 'Frontend Team',
                priority: 'High',
                dueNote: 'Friday',
              },
              {
                task: 'Document memory-mode fallback behavior for self-hosted instances',
                owner: 'Sarah Chen',
                priority: 'Normal',
                dueNote: 'Q3 Launch',
              },
            ],
          },
          citations: [
            {
              documentId: createdDocs[0]?.id,
              documentName: 'q3-strategy-meeting-notes.md',
              snippet: 'Action Items & Ownership: Complete end-to-end integration tests for 5-stage workflow pipeline...',
              score: 0.98,
            },
          ],
          evaluation: {
            score: 0.98,
            confidence: 'High',
            groundedness: 'Direct structural extraction',
            notes: 'Successfully extracted structured tasks, assignees, and target milestones.',
            latencyMs: 290,
          },
          trace: [
            {
              stage: 'Planner',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 40,
              details: { focus: 'Action item pattern matching & owner extraction' },
            },
            {
              stage: 'Retriever',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 22,
              details: { retrievedCount: 2, topScore: 0.98 },
            },
            {
              stage: 'Task',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 140,
              details: { taskType: 'meeting_action_items' },
            },
            {
              stage: 'Writer',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 25,
              details: { schemaValid: true },
            },
            {
              stage: 'Evaluator',
              status: 'completed',
              timestamp: new Date(),
              durationMs: 63,
              details: { score: 0.98, confidence: 'High' },
            },
          ],
        });
      }
    }

    console.log('[Seed] Demo database population complete.');
  } catch (err) {
    console.error('[Seed Error]:', err);
  }
}

module.exports = {
  seedDatabase,
  DEMO_USER,
};
