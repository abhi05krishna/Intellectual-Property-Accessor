const mongoose = require('mongoose');
const Paper = require('../models/paper.model');
const Patent = require('../models/patent.model');
const { similarityToPercent } = require('./embedding.service');
const logger = require('../config/logger');

const VECTOR_INDEX = process.env.VECTOR_INDEX_NAME || 'papers_vector_index';
const DEFAULT_CANDIDATES = 200;  // numCandidates for ANN search (higher = more accurate)
const DEFAULT_LIMIT = 10;        // Top K results to return

/**
 * Perform Atlas Vector Search on the papers collection.
 *
 * Uses $vectorSearch aggregation stage (MongoDB 6.0+, Atlas only).
 * Falls back to text search if vector search is unavailable.
 *
 * @param {number[]} queryEmbedding - 1536-dim query vector
 * @param {object}  filters         - Optional pre-filters (domain, year range, source)
 * @param {number}  limit           - Number of results to return
 */
const searchSimilarPapers = async (queryEmbedding, filters = {}, limit = DEFAULT_LIMIT) => {
  try {
    const pipeline = buildVectorSearchPipeline(queryEmbedding, filters, limit);
    const results = await Paper.aggregate(pipeline);

    return results.map(doc => ({
      paperId: doc._id.toString(),
      title: doc.title,
      authors: doc.authors || [],
      year: doc.year,
      source: doc.source,
      externalId: doc.externalId,
      url: doc.url,
      tags: doc.tags || [],
      journal: doc.journal,
      conference: doc.conference,
      citationCount: doc.citationCount || 0,
      similarityScore: doc.score,           // Raw cosine similarity (0-1)
      similarityPercent: similarityToPercent(doc.score),
    }));

  } catch (err) {
    // Atlas Vector Search not available (local dev / free tier) — fall back to text search
    if (err.message?.includes('$vectorSearch') || err.code === 40324) {
      logger.warn('Vector search unavailable, falling back to text search');
      return textSearchFallback(filters, limit);
    }
    throw err;
  }
};

/**
 * Search patents for similarity.
 */
const searchSimilarPatents = async (queryEmbedding, filters = {}, limit = 5) => {
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: 'patents_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit,
          filter: filters.domain ? { domain: filters.domain } : undefined,
        },
      },
      {
        $project: {
          patentNumber: 1, title: 1, assignee: 1, filingDate: 1,
          publicationDate: 1, tags: 1, domain: 1, url: 1, status: 1,
          score: { $meta: 'vectorSearchScore' },
          
        },
      },
    ];

    const results = await Patent.aggregate(pipeline);
    return results.map(doc => ({
      ...doc,
      similarityScore: doc.score,
      similarityPercent: similarityToPercent(doc.score),
    }));
  } catch {
    return [];
  }
};

/**
 * Build the $vectorSearch aggregation pipeline with optional pre-filters.
 */
const buildVectorSearchPipeline = (queryVector, filters, limit) => {
  const vectorSearchStage = {
    $vectorSearch: {
      index: VECTOR_INDEX,
      path: 'embedding',
      queryVector,
      numCandidates: Math.max(DEFAULT_CANDIDATES, limit * 10),
      limit: limit + 5, // Fetch slightly more for post-filtering
    },
  };

  // Atlas Vector Search pre-filters (must be declared in index definition)
  const preFilter = {};
  if (filters.domain) preFilter.domain = { $eq: filters.domain };
  if (filters.source) preFilter.source = { $in: Array.isArray(filters.source) ? filters.source : [filters.source] };
  if (filters.yearFrom || filters.yearTo) {
    preFilter.year = {};
    if (filters.yearFrom) preFilter.year.$gte = filters.yearFrom;
    if (filters.yearTo) preFilter.year.$lte = filters.yearTo;
  }

  if (Object.keys(preFilter).length > 0) {
    vectorSearchStage.$vectorSearch.filter = preFilter;
  }

  return [
    vectorSearchStage,
    {
      $project: {
        title: 1, abstract: 1, authors: 1, year: 1, source: 1,
        externalId: 1, url: 1, tags: 1, journal: 1, conference: 1,
        citationCount: 1, domain: 1,
        score: { $meta: 'vectorSearchScore' },
        
      },
    },
    { $limit: limit },
  ];
};

/**
 * Text search fallback for local development without Atlas Vector Search.
 */
const textSearchFallback = async (filters, limit) => {
  logger.info('Using text search fallback');
  const query = { isActive: true };
  if (filters.domain) query.domain = filters.domain;

  const papers = await Paper.find(query)
    .select('-embedding')
    .sort({ citationCount: -1 })
    .limit(limit);

  return papers.map((p, i) => ({
    paperId: p._id.toString(),
    title: p.title,
    authors: p.authors || [],
    year: p.year,
    source: p.source,
    externalId: p.externalId,
    url: p.url,
    tags: p.tags || [],
    similarityScore: 0.5 - i * 0.02, // Mock scores for dev
    similarityPercent: Math.max(0, 30 - i * 5),
  }));
};

/**
 * Map comparisonDatabase selection to source filter.
 */
const getSourceFilter = (comparisonDatabase) => {
  const map = {
    all: null,
    academic: ['arxiv', 'semantic_scholar', 'ieee', 'acm', 'pubmed'],
    patents: ['patent'],
    arxiv_ieee_acm: ['arxiv', 'ieee', 'acm'],
  };
  return map[comparisonDatabase] || null;
};

module.exports = {
  searchSimilarPapers,
  searchSimilarPatents,
  getSourceFilter,
};
