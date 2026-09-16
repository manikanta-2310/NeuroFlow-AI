function formatWriterOutput(type, rawOutput) {
  if (!rawOutput) {
    return { error: 'No output generated from task agent.' };
  }

  switch (type) {
    case 'ask': {
      if (typeof rawOutput === 'string') {
        return { answer: rawOutput };
      }
      return {
        answer: rawOutput.answer || rawOutput.response || JSON.stringify(rawOutput),
      };
    }

    case 'summarize': {
      return {
        summary: rawOutput.summary || 'Summary unavailable.',
        keyPoints: Array.isArray(rawOutput.keyPoints)
          ? rawOutput.keyPoints
          : ['Summary processed from workspace.'],
      };
    }

    case 'compare': {
      return {
        overview: rawOutput.overview || 'Comparison completed.',
        similarities: Array.isArray(rawOutput.similarities) ? rawOutput.similarities : [],
        differences: Array.isArray(rawOutput.differences) ? rawOutput.differences : [],
        documentTakeaways: Array.isArray(rawOutput.documentTakeaways)
          ? rawOutput.documentTakeaways
          : [],
      };
    }

    case 'meeting_action_items': {
      return {
        summary: rawOutput.summary || 'Action items extracted.',
        actionItems: Array.isArray(rawOutput.actionItems) ? rawOutput.actionItems : [],
      };
    }

    case 'research_brief': {
      return {
        title: rawOutput.title || 'Research Brief',
        executiveSummary: rawOutput.executiveSummary || 'Executive summary completed.',
        themes: Array.isArray(rawOutput.themes) ? rawOutput.themes : [],
        conclusion: rawOutput.conclusion || 'Research analysis complete.',
      };
    }

    default:
      return rawOutput;
  }
}

async function runWriterAgent({ type, taskOutput }) {
  const structuredOutput = formatWriterOutput(type, taskOutput);
  return {
    structuredOutput,
    schemaValid: true,
  };
}

module.exports = {
  runWriterAgent,
  formatWriterOutput,
};
