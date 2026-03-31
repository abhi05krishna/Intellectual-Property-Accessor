const mongoose = require('mongoose');

const similarWorkSchema = new mongoose.Schema({
  paperId: String,
  title: String,
  authors: [String],
  year: Number,
  source: { type: String, enum: ['arxiv', 'semantic_scholar', 'patent', 'ieee', 'acm', 'pubmed'] },
  externalId: String,       // ArXiv ID, DOI, patent number etc.
  url: String,
  similarityScore: {        // 0-1 cosine similarity from vector search
    type: Number,
    min: 0,
    max: 1,
  },
  similarityPercent: Number, // 0-100 for display
  matchedSections: [String], // Which sections overlap
  tags: [String],
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['strength', 'improvement', 'suggestion', 'gap', 'citation_gap'],
  },
  title: String,
  description: String,
  priority: { type: String, enum: ['high', 'medium', 'low'] },
}, { _id: false });

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Input
    title: { type: String, trim: true },
    abstract: { type: String, required: true },
    domain: {
      type: String,
      enum: [
        'Computer Science & AI', 'Biotechnology', 'Mechanical Engineering',
        'Medicine & Health', 'Physics', 'Chemistry', 'Social Sciences', 'Other',
      ],
      default: 'Other',
    },
    documentType: {
      type: String,
      enum: ['abstract', 'paper', 'thesis', 'patent_application', 'technical_report'],
      default: 'abstract',
    },
    comparisonDatabase: {
      type: String,
      enum: ['all', 'academic', 'patents', 'arxiv_ieee_acm'],
      default: 'all',
    },
    uploadedFile: {
      originalName: String,
      storedName: String,
      mimeType: String,
      sizeBytes: Number,
    },

    // Embedding (stored for re-use, not returned to client)
    embedding: {
      type: [Number],
      select: false,
    },

    // Results
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    scores: {
      originality: { type: Number, min: 0, max: 100 },   // Higher = more original
      similarity: { type: Number, min: 0, max: 100 },    // Higher = more similar to existing
      noveltyPotential: { type: Number, min: 0, max: 100 },
    },
    similarWorks: [similarWorkSchema],
    recommendations: [recommendationSchema],
    aiSummary: String,       // Short AI-generated summary of findings
    processingTimeMs: Number,
    errorMessage: String,

    // Metadata
    totalCompared: Number,   // How many papers were compared
    databaseSnapshot: Date,  // When the comparison DB was last updated
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
analysisSchema.index({ user: 1, createdAt: -1 });
analysisSchema.index({ status: 1 });
analysisSchema.index({ domain: 1 });
analysisSchema.index({ 'scores.originality': -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
