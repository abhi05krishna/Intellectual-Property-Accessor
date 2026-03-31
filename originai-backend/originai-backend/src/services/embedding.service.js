

const OpenAI = require('openai');
const logger = require('../config/logger');
let openai = null;

if (process.env.OPENAI_API_KEY) {
  const OpenAI = require("openai");
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_TOKENS = 8000; // Safe limit for this model

/**
 * Truncates text to stay within token limits.
 * Rough approximation: 1 token ≈ 4 characters.
 */
const truncateText = (text, maxChars = MAX_TOKENS * 4) => {
  if (text.length <= maxChars) return text;
  logger.warn(`Text truncated from ${text.length} to ${maxChars} chars for embedding`);
  return text.slice(0, maxChars);
};

/**
 * Generate embedding for a single text string.
 * Returns a 1536-dimensional float array.
 */
// const generateEmbedding = async (text) => {
//   const cleanText = truncateText(text.replace(/\n+/g, ' ').trim());

//   const response = await openai.embeddings.create({
//     model: EMBEDDING_MODEL,
//     input: cleanText,
//     dimensions: EMBEDDING_DIMENSIONS,
//   });

//   return response.data[0].embedding;
// };

const generateEmbedding = async (text) => {
  // ✅ If OpenAI key not provided → return dummy vector
  if (!openai) {
    console.log("⚠️ OpenAI disabled — returning dummy embedding");
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const cleanText = truncateText(text.replace(/\n+/g, ' ').trim());

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanText,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
};

/**
 * Generate embeddings for multiple texts in batch.
 * OpenAI supports up to 2048 inputs per request.
 */
// const generateEmbeddingsBatch = async (texts, batchSize = 100) => {
//   const results = [];

//   for (let i = 0; i < texts.length; i += batchSize) {
//     const batch = texts.slice(i, i + batchSize).map(t =>
//       truncateText(t.replace(/\n+/g, ' ').trim())
//     );

//     const response = await openai.embeddings.create({
//       model: EMBEDDING_MODEL,
//       input: batch,
//       dimensions: EMBEDDING_DIMENSIONS,
//     });

//     results.push(...response.data.map(d => d.embedding));
//     logger.info(`Embedded batch ${i / batchSize + 1} (${batch.length} texts)`);
//   }

//   return results;
// };

const generateEmbeddingsBatch = async (texts, batchSize = 100) => {
  // ✅ If OpenAI key not provided → return dummy vectors
  if (!openai) {
    console.log("⚠️ OpenAI disabled — returning dummy embeddings batch");
    return texts.map(() => new Array(EMBEDDING_DIMENSIONS).fill(0));
  }

  const results = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map(t =>
      truncateText(t.replace(/\n+/g, ' ').trim())
    );

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    results.push(...response.data.map(d => d.embedding));
    logger.info(`Embedded batch ${i / batchSize + 1} (${batch.length} texts)`);
  }

  return results;
};

/**
 * Compute cosine similarity between two embedding vectors.
 * Returns value between -1 and 1 (1 = identical).
 */
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) throw new Error('Vector dimension mismatch');

  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] ** 2;
    magB += vecB[i] ** 2;
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dot / magnitude;
};

/**
 * Convert cosine similarity (0-1) to a human-readable similarity percentage.
 * Applies calibration to prevent inflation — most distinct papers score 0.7-0.9 raw cosine.
 */
const similarityToPercent = (cosineSim) => {
  // Calibrated: cosine 0.5 → ~5%, 0.8 → ~40%, 0.95 → ~85%
  const calibrated = Math.max(0, (cosineSim - 0.5) / 0.5);
  return Math.round(calibrated * 100);
};

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  cosineSimilarity,
  similarityToPercent,
  EMBEDDING_DIMENSIONS,
};
