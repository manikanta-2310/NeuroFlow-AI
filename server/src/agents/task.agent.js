const { generateChatResponse } = require('../services/ollama.service');
const fallbacks = require('./fallbacks');

async function runTaskAgent({ type, input, chunks = [], docNames = {} }) {
  const contextText = chunks
    .map((c, i) => `[Source ${i + 1} (${c.documentName})]:\n${c.text}`)
    .join('\n\n');

  let prompt = [];

  switch (type) {
    case 'ask': {
      prompt = [
        {
          role: 'system',
          content:
            'You are an expert document intelligence assistant. Provide a comprehensive, detailed, and well-structured answer to the user question using the provided context chunks. Explain all relevant concepts thoroughly, use markdown formatting with headers, bullet points, or step-by-step breakdowns where helpful, and remain strictly grounded in the context.',
        },
        {
          role: 'user',
          content: `Document Context:\n${contextText}\n\nUser Question: ${input.question || 'Provide a detailed overview of the document content.'}`,
        },
      ];
      const raw = await generateChatResponse(prompt, { temperature: 0.3 });
      if (!raw) return fallbacks.fallbackAsk(input.question, chunks);
      return { answer: raw };
    }

    case 'summarize': {
      prompt = [
        {
          role: 'system',
          content:
            'You are an executive document intelligence analyst. Produce a detailed, high-value summary of the provided document context with comprehensive key takeaways. Output strictly valid JSON matching this schema: { "summary": "detailed multi-paragraph summary string", "keyPoints": ["detailed point 1", "detailed point 2", "detailed point 3", "detailed point 4", "detailed point 5"] }',
        },
        {
          role: 'user',
          content: `Document Context:\n${contextText}\n\nInstructions: ${input.prompt || 'Provide a thorough, comprehensive executive summary and detailed key insights.'}`,
        },
      ];
      const raw = await generateChatResponse(prompt, { temperature: 0.2 });
      if (!raw) return fallbacks.fallbackSummarize(input.prompt, chunks);
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        return { summary: raw, keyPoints: ['Comprehensive summary generated from document context.'] };
      }
    }

    case 'compare': {
      prompt = [
        {
          role: 'system',
          content:
            'Compare the provided documents based on the context. Output strictly JSON with keys: overview (string), similarities (string array), differences (string array), documentTakeaways (array of { documentId, documentName, takeaway }).',
        },
        {
          role: 'user',
          content: `Context:\n${contextText}\n\nDocuments to compare: ${JSON.stringify(docNames)}\n\nPrompt: ${input.prompt || 'Compare similarities and differences.'}`,
        },
      ];
      const raw = await generateChatResponse(prompt);
      if (!raw) return fallbacks.fallbackCompare(input.documentIds, chunks, docNames);
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        return fallbacks.fallbackCompare(input.documentIds, chunks, docNames);
      }
    }

    case 'meeting_action_items': {
      prompt = [
        {
          role: 'system',
          content:
            'Extract meeting action items and decisions. Output strictly JSON: { "summary": "string", "actionItems": [ { "task": "string", "owner": "string", "priority": "High|Medium|Low", "dueNote": "string" } ] }',
        },
        {
          role: 'user',
          content: `Context:\n${contextText}\n\nPrompt: ${input.prompt || 'Extract all action items and assignments.'}`,
        },
      ];
      const raw = await generateChatResponse(prompt);
      if (!raw) return fallbacks.fallbackMeetingActionItems(input.prompt, chunks);
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        return fallbacks.fallbackMeetingActionItems(input.prompt, chunks);
      }
    }

    case 'research_brief': {
      prompt = [
        {
          role: 'system',
          content:
            'Create a professional research brief. Output strictly JSON: { "title": "string", "executiveSummary": "string", "themes": [ { "heading": "string", "details": ["string"] } ], "conclusion": "string" }',
        },
        {
          role: 'user',
          content: `Topic: ${input.topic || 'General Overview'}\n\nContext:\n${contextText}\n\nPrompt: ${input.prompt || 'Generate full thematic research brief.'}`,
        },
      ];
      const raw = await generateChatResponse(prompt);
      if (!raw) return fallbacks.fallbackResearchBrief(input.topic, chunks);
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        return fallbacks.fallbackResearchBrief(input.topic, chunks);
      }
    }

    default:
      return fallbacks.fallbackSummarize('', chunks);
  }
}

module.exports = { runTaskAgent };
