const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { parse: parseCsv } = require('csv-parse/sync');
let tesseract = null;
try {
  tesseract = require('tesseract.js');
} catch (e) {
  console.warn('[Extraction] tesseract.js not available:', e.message);
}

function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // 1. Normalize line breaks and tabs
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[\u00A0\u2000-\u200B]/g, ' ');

  // 2. Join orphaned single-word or broken formula lines
  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
  const joinedLines = [];
  let buffer = '';

  for (const line of lines) {
    // If line is very short and doesn't end with sentence terminator, append to buffer
    if (buffer && !/[.!?:]$/.test(buffer) && line.length < 40 && !/^[-*#\d.]/.test(line)) {
      buffer = `${buffer} ${line}`;
    } else {
      if (buffer) joinedLines.push(buffer);
      buffer = line;
    }
  }
  if (buffer) joinedLines.push(buffer);

  cleaned = joinedLines.join('\n\n');
  return cleaned
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function generateSimpleSummary(text, maxSentences = 3) {
  if (!text) return '';
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      // Must be reasonable length and contain at least 4 real words
      const words = s.split(/\s+/).filter((w) => w.length > 2);
      return s.length > 30 && words.length >= 4 && !s.startsWith('#');
    });

  if (sentences.length === 0) {
    return text.slice(0, 300).trim() + '...';
  }
  return sentences.slice(0, maxSentences).join(' ');
}

async function extractTextFromPdf(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return {
    text: cleanText(data.text),
    pageCount: data.numpages || 1,
    info: data.info || {},
  };
}

async function extractTextFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return {
    text: cleanText(result.value),
    pageCount: 1,
    messages: result.messages,
  };
}

async function extractTextFromCsv(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const records = parseCsv(fileContent, {
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  if (!records || records.length === 0) {
    return { text: '', pageCount: 1 };
  }

  const header = records[0];
  const rows = records.slice(1);
  const formattedRows = rows.map((row, index) => {
    const fields = row.map((val, i) => `${header[i] || `Col_${i + 1}`}: ${val}`).join(' | ');
    return `[Row ${index + 1}] ${fields}`;
  });

  const fullText = `CSV Columns: ${header.join(', ')}\n\n` + formattedRows.join('\n');
  return {
    text: cleanText(fullText),
    pageCount: Math.ceil(records.length / 50) || 1,
    rowCount: records.length,
  };
}

async function extractTextFromPlainText(filePath) {
  const text = await fs.readFile(filePath, 'utf-8');
  return {
    text: cleanText(text),
    pageCount: 1,
  };
}

async function extractTextFromImage(filePath) {
  if (!tesseract) {
    throw new Error('Tesseract OCR engine is not installed or available.');
  }

  const { data } = await tesseract.recognize(filePath, 'eng', {
    logger: () => {},
  });

  return {
    text: cleanText(data.text),
    pageCount: 1,
    confidence: data.confidence,
  };
}

async function extractDocumentText(filePath, fileType) {
  let result = { text: '', pageCount: 1, metadata: {} };

  switch (fileType.toLowerCase()) {
    case 'pdf':
      result = await extractTextFromPdf(filePath);
      break;
    case 'docx':
      result = await extractTextFromDocx(filePath);
      break;
    case 'csv':
      result = await extractTextFromCsv(filePath);
      break;
    case 'txt':
    case 'md':
      result = await extractTextFromPlainText(filePath);
      break;
    case 'image':
      result = await extractTextFromImage(filePath);
      break;
    default:
      // Try plain text read as fallback
      result = await extractTextFromPlainText(filePath);
      break;
  }

  const summary = generateSimpleSummary(result.text);

  return {
    text: result.text,
    pageCount: result.pageCount || 1,
    summary,
    metadata: result.info || result.metadata || {},
  };
}

module.exports = {
  extractDocumentText,
  cleanText,
  generateSimpleSummary,
};
