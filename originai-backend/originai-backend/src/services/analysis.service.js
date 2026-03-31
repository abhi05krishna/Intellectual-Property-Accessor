const Analysis = require('../models/analysis.model');
const { generateEmbedding } = require('./embedding.service');
const { searchSimilarPapers, searchSimilarPatents, getSourceFilter } = require('./vectorSearch.service');
const { generateRecommendations } = require('./aiRecommendations.service');
const logger = require('../config/logger');

/**
 * Main analysis pipeline:
 * 1. Generate embedding for the submitted text
 * 2. Vector search against the corpus
 * 3. Compute originality scores
 * 4. Generate AI recommendations
 * 5. Persist and return results
 */
const runAnalysisPipeline = async (analysisId) => {
  const startTime = Date.now();
  let analysis;

  try {
    analysis = await Analysis.findById(analysisId);
    if (!analysis) throw new Error(`Analysis ${analysisId} not found`);

    // Mark as processing
    analysis.status = 'processing';
    await analysis.save();

    logger.info(`[Analysis ${analysisId}] Pipeline started — domain: ${analysis.domain}`);

    // ── Step 1: Generate Embedding ──────────────────────────
    logger.info(`[Analysis ${analysisId}] Generating embedding...`);
    const textToEmbed = buildEmbeddingText(analysis);
    const embedding = await generateEmbedding(textToEmbed);

    // Store embedding on the document (select: false keeps it hidden from API)
    analysis.embedding = embedding;

    // ── Step 2: Vector Search ───────────────────────────────
    logger.info(`[Analysis ${analysisId}] Searching vector database...`);

    const sourceFilter = getSourceFilter(analysis.comparisonDatabase);
    const searchFilters = {
      domain: analysis.domain !== 'Other' ? analysis.domain : undefined,
      source: sourceFilter,
    };

    const [similarPapers, similarPatents] = await Promise.all([
      searchSimilarPapers(embedding, searchFilters, 10),
      analysis.comparisonDatabase === 'all' || analysis.comparisonDatabase === 'patents'
        ? searchSimilarPatents(embedding, searchFilters, 5)
        : Promise.resolve([]),
    ]);

    logger.info(`[Analysis ${analysisId}] Found ${similarPapers.length} similar papers, ${similarPatents.length} patents`);

    // ── Step 3: Score Calculation ───────────────────────────
    const scores = calculateScores(similarPapers, similarPatents);

    // ── Step 4: Merge similar works ─────────────────────────
    const allSimilarWorks = [
      ...similarPapers.map(p => ({ ...p, matchedSections: [] })),
      ...similarPatents.map(p => ({
        paperId: p._id?.toString(),
        title: p.title,
        authors: p.inventors || [],
        year: p.publicationDate?.getFullYear(),
        source: 'patent',
        externalId: p.patentNumber,
        url: p.url,
        tags: p.tags || [],
        similarityScore: p.similarityScore,
        similarityPercent: p.similarityPercent,
        matchedSections: [],
      })),
    ]
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);

    // ── Step 5: AI Recommendations ──────────────────────────
    logger.info(`[Analysis ${analysisId}] Generating AI recommendations...`);
    const { recommendations, aiSummary } = await generateRecommendations({
      abstract: analysis.abstract,
      domain: analysis.domain,
      similarWorks: allSimilarWorks,
      scores,
    });

    // ── Step 6: Save Results ────────────────────────────────
    const processingTimeMs = Date.now() - startTime;

    analysis.scores = scores;
    analysis.similarWorks = allSimilarWorks;
    analysis.recommendations = recommendations;
    analysis.aiSummary = aiSummary;
    analysis.status = 'completed';
    analysis.processingTimeMs = processingTimeMs;
    analysis.totalCompared = similarPapers.length + similarPatents.length;
    analysis.databaseSnapshot = new Date();

    await analysis.save();
    logger.info(`[Analysis ${analysisId}] Completed in ${processingTimeMs}ms`);

    // Update user stats asynchronously
    updateUserStats(analysis.user, scores.originality).catch(err =>
      logger.warn(`Failed to update user stats: ${err.message}`)
    );

    return analysis;

  } catch (err) {
    logger.error(`[Analysis ${analysisId}] Pipeline failed: ${err.message}`);
    if (analysis) {
      analysis.status = 'failed';
      analysis.errorMessage = err.message;
      await analysis.save().catch(() => {});
    }
    throw err;
  }
};

/**
 * Build the text to embed. Combines title + abstract for richer representation.
 */
const buildEmbeddingText = (analysis) => {
  const parts = [];
  if (analysis.title) parts.push(`Title: ${analysis.title}`);
  parts.push(`Abstract: ${analysis.abstract}`);
  if (analysis.domain) parts.push(`Domain: ${analysis.domain}`);
  return parts.join('\n\n');
};

/**
 * Calculate originality, similarity, and novelty scores from search results.
 *
 * - similarity: Weighted average of top-3 similarity scores
 * - originality: Inverse of similarity (penalizes high overlap)
 * - noveltyPotential: Combination of originality + low citation overlap
 */
const calculateScores = (papers, patents) => {
  const allResults = [...papers, ...patents].sort(
    (a, b) => b.similarityScore - a.similarityScore
  );

  if (allResults.length === 0) {
    return { originality: 95, similarity: 5, noveltyPotential: 90 };
  }

  // Weighted similarity: top result counts most
  const weights = [0.5, 0.3, 0.15, 0.05];
  let weightedSimilarity = 0;
  let totalWeight = 0;

  allResults.slice(0, 4).forEach((r, i) => {
    const w = weights[i] || 0.01;
    weightedSimilarity += r.similarityPercent * w;
    totalWeight += w;
  });

  const similarity = Math.round(weightedSimilarity / totalWeight);
  const originality = Math.min(100, Math.max(0, 100 - similarity));

  // Novelty: higher if top works are old or low citation, meaning the space is less saturated
  const avgCitations = papers.slice(0, 3).reduce((s, p) => s + (p.citationCount || 0), 0) / 3;
  const citationPenalty = Math.min(10, avgCitations / 1000);
  const noveltyPotential = Math.min(100, Math.round(originality * 0.9 + 10 - citationPenalty));

  return { originality, similarity, noveltyPotential };
};

/**
 * Update user's running average originality score.
 */
const updateUserStats = async (userId, originalityScore) => {
  const User = require('../models/user.model');
  const user = await User.findById(userId);
  if (user) await user.updateStats(originalityScore);
};

module.exports = { runAnalysisPipeline };
