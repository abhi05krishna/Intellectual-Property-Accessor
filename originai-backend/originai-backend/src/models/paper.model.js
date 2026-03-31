const mongoose = require('mongoose');

/**
 * Paper model — stores academic papers, patents, and technical documents
 * used as the comparison corpus for similarity search.
 *
 * The `embedding` field is indexed via MongoDB Atlas Vector Search
 * (see config/database.js for index creation).
 */
const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    abstract: { type: String, required: true },
    authors: [{ type: String, trim: true }],
    year: { type: Number, index: true },
    domain: {
      type: String,
      enum: [
        'Computer Science & AI', 'Biotechnology', 'Mechanical Engineering',
        'Medicine & Health', 'Physics', 'Chemistry', 'Social Sciences', 'Other',
      ],
      index: true,
    },
    source: {
      type: String,
      enum: ['arxiv', 'semantic_scholar', 'patent', 'ieee', 'acm', 'pubmed', 'manual'],
      required: true,
      index: true,
    },
    externalId: { type: String, unique: true, sparse: true }, // ArXiv ID, DOI, patent no.
    url: String,
    tags: [{ type: String, lowercase: true }],
    citationCount: { type: Number, default: 0 },
    journal: String,
    conference: String,

    // Vector embedding — 1536 dimensions (OpenAI text-embedding-3-small)
    // Indexed by Atlas Vector Search for fast ANN similarity queries
    embedding: {
      type: [Number],
      required: true,
      select: false, // Exclude from default queries (large field)
    },

    // Freshness tracking
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Text index for keyword fallback search
paperSchema.index({ title: 'text', abstract: 'text', tags: 'text' });
paperSchema.index({ source: 1, externalId: 1 });
paperSchema.index({ domain: 1, year: -1 });

module.exports = mongoose.model('Paper', paperSchema);
