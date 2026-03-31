const axios = require('axios');
const Paper = require('../models/paper.model');
const Patent = require('../models/patent.model');
const { generateEmbeddingsBatch } = require('./embedding.service');
const logger = require('../config/logger');

// ── ArXiv Ingestion ──────────────────────────────────────────

const ARXIV_DOMAIN_QUERIES = {
  'Computer Science & AI': 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL',
  'Biotechnology': 'cat:q-bio.BM+OR+cat:q-bio.GN',
  'Physics': 'cat:physics.gen-ph+OR+cat:cond-mat',
  'Medicine & Health': 'cat:q-bio.QM',
};

/**
 * Fetch recent papers from ArXiv API and ingest into MongoDB.
 * @param {string} domain - Domain to fetch for
 * @param {number} maxResults - Max papers to fetch
 */
const ingestFromArxiv = async (domain = 'Computer Science & AI', maxResults = 100) => {
  const query = ARXIV_DOMAIN_QUERIES[domain] || 'cat:cs.AI';
  const url = `${process.env.ARXIV_API || 'http://export.arxiv.org/api/query'}?search_query=${query}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

  try {
    logger.info(`Fetching ${maxResults} papers from ArXiv for domain: ${domain}`);
    const response = await axios.get(url, { timeout: 30000 });

    const papers = parseArxivXML(response.data, domain);
    logger.info(`Parsed ${papers.length} papers from ArXiv`);

    await embedAndStorePapers(papers, 'arxiv');
    return papers.length;

  } catch (err) {
    logger.error(`ArXiv ingestion failed: ${err.message}`);
    throw err;
  }
};

const parseArxivXML = (xml, domain) => {
  // Simple regex-based parser (use xml2js in production for robustness)
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

  return entries.map(entry => {
    const getId = (tag) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`));
      return m ? m[1].trim().replace(/<[^>]+>/g, '') : '';
    };

    const authors = (entry.match(/<name>([^<]+)<\/name>/g) || [])
      .map(a => a.replace(/<\/?name>/g, '').trim());

    const arxivId = getId('id').split('/abs/').pop();
    const publishedStr = getId('published');
    const year = publishedStr ? new Date(publishedStr).getFullYear() : null;

    return {
      title: getId('title').replace(/\s+/g, ' '),
      abstract: getId('summary').replace(/\s+/g, ' '),
      authors,
      year,
      domain,
      source: 'arxiv',
      externalId: arxivId,
      url: `https://arxiv.org/abs/${arxivId}`,
      tags: [],
    };
  }).filter(p => p.title && p.abstract && p.externalId);
};

// ── Semantic Scholar Ingestion ───────────────────────────────

/**
 * Fetch papers from Semantic Scholar API.
 * Free tier: 100 req/5min. No API key needed for basic access.
 */
const ingestFromSemanticScholar = async (query, domain, limit = 50) => {
  const baseUrl = process.env.SEMANTIC_SCHOLAR_API || 'https://api.semanticscholar.org/graph/v1';
  const fields = 'title,abstract,authors,year,externalIds,url,citationCount,venue,publicationVenue';

  try {
    const response = await axios.get(`${baseUrl}/paper/search`, {
      params: { query, fields, limit },
      timeout: 20000,
      headers: { 'User-Agent': 'OriginAI/1.0 (research originality platform)' },
    });

    const papers = (response.data.data || [])
      .filter(p => p.abstract)
      .map(p => ({
        title: p.title,
        abstract: p.abstract,
        authors: (p.authors || []).map(a => a.name),
        year: p.year,
        domain,
        source: 'semantic_scholar',
        externalId: p.externalIds?.DOI || p.paperId,
        url: p.url,
        citationCount: p.citationCount || 0,
        journal: p.publicationVenue?.name,
        tags: [],
      }));

    logger.info(`Fetched ${papers.length} papers from Semantic Scholar`);
    await embedAndStorePapers(papers, 'semantic_scholar');
    return papers.length;

  } catch (err) {
    logger.error(`Semantic Scholar ingestion failed: ${err.message}`);
    throw err;
  }
};

// ── USPTO Patent Ingestion ───────────────────────────────────

/**
 * Fetch recent patents from USPTO Open Data API.
 */
const ingestFromUSPTO = async (keyword, domain, limit = 50) => {
  const baseUrl = process.env.USPTO_API || 'https://developer.uspto.gov/ibd-api/v1';

  try {
    const response = await axios.get(`${baseUrl}/patent/application`, {
      params: {
        searchText: keyword,
        start: 0,
        rows: limit,
        dateRangeField: 'applicationFilingDate',
      },
      timeout: 20000,
    });

    const patents = (response.data.results || []).map(p => ({
      patentNumber: p.patentNumber || p.applicationNumber,
      title: p.inventionTitle,
      abstract: p.abstractText,
      inventors: p.inventorName ? [p.inventorName] : [],
      assignee: p.assigneeEntityName,
      filingDate: p.applicationFilingDate ? new Date(p.applicationFilingDate) : null,
      domain,
      office: 'USPTO',
      url: `https://patents.google.com/patent/${p.patentNumber}`,
      tags: [keyword.toLowerCase()],
    })).filter(p => p.abstract);

    logger.info(`Fetched ${patents.length} patents from USPTO`);
    await embedAndStorePatents(patents);
    return patents.length;

  } catch (err) {
    logger.error(`USPTO ingestion failed: ${err.message}`);
    throw err;
  }
};

// ── Shared Embed + Store Helpers ─────────────────────────────

const embedAndStorePapers = async (papers, source) => {
  const newPapers = [];

  // Skip already-existing papers (by externalId)
  for (const paper of papers) {
    if (paper.externalId) {
      const exists = await Paper.exists({ externalId: paper.externalId });
      if (exists) continue;
    }
    newPapers.push(paper);
  }

  if (newPapers.length === 0) {
    logger.info('No new papers to embed — all already exist');
    return;
  }

  logger.info(`Generating embeddings for ${newPapers.length} new papers...`);
  const texts = newPapers.map(p => `${p.title}\n\n${p.abstract}`);
  const embeddings = await generateEmbeddingsBatch(texts);

  const docs = newPapers.map((p, i) => ({ ...p, embedding: embeddings[i] }));

  await Paper.insertMany(docs, { ordered: false }).catch(err => {
    if (err.code !== 11000) throw err; // Ignore duplicate key errors
    logger.warn(`Some papers already existed (duplicate key)`);
  });

  logger.info(`Stored ${docs.length} papers from ${source}`);
};

const embedAndStorePatents = async (patents) => {
  const newPatents = [];

  for (const patent of patents) {
    const exists = await Patent.exists({ patentNumber: patent.patentNumber });
    if (!exists) newPatents.push(patent);
  }

  if (newPatents.length === 0) return;

  const texts = newPatents.map(p => `${p.title}\n\n${p.abstract}`);
  const embeddings = await generateEmbeddingsBatch(texts);
  const docs = newPatents.map((p, i) => ({ ...p, embedding: embeddings[i] }));

  await Patent.insertMany(docs, { ordered: false }).catch(err => {
    if (err.code !== 11000) throw err;
  });

  logger.info(`Stored ${docs.length} patents`);
};

module.exports = {
  ingestFromArxiv,
  ingestFromSemanticScholar,
  ingestFromUSPTO,
};
