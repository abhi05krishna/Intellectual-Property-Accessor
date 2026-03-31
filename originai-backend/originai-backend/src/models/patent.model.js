const mongoose = require('mongoose');

const patentSchema = new mongoose.Schema(
  {
    patentNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    abstract: { type: String },
    inventors: [String],
    assignee: String,
    filingDate: Date,
    publicationDate: Date,
    grantDate: Date,
    status: {
      type: String,
      enum: ['pending', 'granted', 'expired', 'abandoned'],
      default: 'pending',
    },
    office: {
      type: String,
      enum: ['USPTO', 'EPO', 'WIPO', 'IPO', 'OTHER'],
      default: 'USPTO',
    },
    classifications: [String], // CPC / IPC codes
    tags: [String],
    domain: String,
    url: String,
    claims: [String],         // Independent claims text
    embedding: {
      type: [Number],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

patentSchema.index({ patentNumber: 1 });
patentSchema.index({ domain: 1, publicationDate: -1 });
patentSchema.index({ title: 'text', abstract: 'text' });

module.exports = mongoose.model('Patent', patentSchema);
