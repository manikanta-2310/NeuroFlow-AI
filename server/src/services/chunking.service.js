function approximateTokenCount(text) {
  if (!text) return 0;
  // ~4 characters per token heuristic for English text
  return Math.ceil(text.trim().length / 4);
}

function chunkText(text, options = {}) {
  const targetSize = options.targetSize || 1200;
  const overlap = options.overlap || 200;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }

  const cleaned = text.trim();
  if (cleaned.length <= targetSize) {
    return [
      {
        chunkIndex: 0,
        text: cleaned,
        tokenCountApprox: approximateTokenCount(cleaned),
        metadata: {
          startChar: 0,
          endChar: cleaned.length,
          isFullDoc: true,
        },
      },
    ];
  }

  const paragraphs = cleaned.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';
  let currentStart = 0;
  let chunkIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para) continue;

    // If adding this paragraph fits nicely in targetSize
    if (currentChunk.length + para.length + 2 <= targetSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else {
      // If currentChunk has content, push it
      if (currentChunk.length > 0) {
        chunks.push({
          chunkIndex,
          text: currentChunk,
          tokenCountApprox: approximateTokenCount(currentChunk),
          metadata: {
            startChar: currentStart,
            endChar: currentStart + currentChunk.length,
          },
        });
        chunkIndex++;

        // Calculate overlap start
        const overlapText = currentChunk.slice(-overlap);
        currentStart += currentChunk.length - overlapText.length;
        currentChunk = overlapText;
      }

      // If single paragraph itself is larger than targetSize, split by sentences or hard window
      if (para.length > targetSize) {
        const sentences = para.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [para];
        for (const sentence of sentences) {
          const s = sentence.trim();
          if (!s) continue;
          if (currentChunk.length + s.length + 1 <= targetSize) {
            currentChunk = currentChunk ? `${currentChunk} ${s}` : s;
          } else {
            if (currentChunk.length > 0) {
              chunks.push({
                chunkIndex,
                text: currentChunk,
                tokenCountApprox: approximateTokenCount(currentChunk),
                metadata: {
                  startChar: currentStart,
                  endChar: currentStart + currentChunk.length,
                },
              });
              chunkIndex++;
              const overlapText = currentChunk.slice(-overlap);
              currentStart += currentChunk.length - overlapText.length;
              currentChunk = overlapText;
            }
            currentChunk = currentChunk ? `${currentChunk} ${s}` : s;
          }
        }
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
      }
    }
  }

  // Push remaining chunk if any
  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkIndex,
      text: currentChunk.trim(),
      tokenCountApprox: approximateTokenCount(currentChunk.trim()),
      metadata: {
        startChar: currentStart,
        endChar: currentStart + currentChunk.length,
      },
    });
  }

  return chunks;
}

module.exports = {
  chunkText,
  approximateTokenCount,
};
