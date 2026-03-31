const Paper = require('../models/paper.model');
const { ingestFromArxiv, ingestFromSemanticScholar } = require('../services/ingestion.service');
const AppError = require('../utils/appError');

/**
 * GET /api/papers
 * Search + filter papers in the corpus.
 */
exports.getPapers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, domain, source, year, q } = req.query;
    const filter = { isActive: true };
    if (domain) filter.domain = domain;
    if (source) filter.source = source;
    if (year) filter.year = parseInt(year);
    if (q) filter.$text = { $search: q };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [papers, total] = await Promise.all([
      Paper.find(filter)
        .select('-embedding')
        .sort({ year: -1, citationCount: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Paper.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { papers, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/papers/stats
 * Corpus statistics.
 */
exports.getCorpusStats = async (req, res, next) => {
  try {
    const [totalPapers, bySource, byDomain] = await Promise.all([
      Paper.countDocuments({ isActive: true }),
      Paper.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      Paper.aggregate([{ $group: { _id: '$domain', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: { totalPapers, bySource, byDomain, lastUpdated: new Date() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/papers/ingest/arxiv  [Admin only]
 */
exports.ingestArxiv = async (req, res, next) => {
  try {
    const { domain = 'Computer Science & AI', maxResults = 100 } = req.body;
    const count = await ingestFromArxiv(domain, maxResults);
    res.json({ success: true, message: `Ingested ${count} papers from ArXiv.` });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/papers/ingest/semantic-scholar  [Admin only]
 */
exports.ingestSemanticScholar = async (req, res, next) => {
  try {
    const { query, domain, limit = 50 } = req.body;
    if (!query || !domain) return next(new AppError('query and domain are required.', 400));
    const count = await ingestFromSemanticScholar(query, domain, limit);
    res.json({ success: true, message: `Ingested ${count} papers from Semantic Scholar.` });
  } catch (err) {
    next(err);
  }
};
