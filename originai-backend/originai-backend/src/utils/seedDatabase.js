/**
 * Seed script — populates the database with sample papers for development.
 * Run: node src/utils/seedDatabase.js
 *
 * In production, use the ingestion endpoints instead.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Paper = require('../models/paper.model');
const Patent = require('../models/patent.model');
const User = require('../models/user.model');
const logger = require('../config/logger');

const SAMPLE_PAPERS = [
  {
    title: 'Attention Is All You Need',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.'],
    year: 2017,
    domain: 'Computer Science & AI',
    source: 'arxiv',
    externalId: '1706.03762',
    url: 'https://arxiv.org/abs/1706.03762',
    citationCount: 95000,
    tags: ['transformers', 'attention', 'nlp', 'deep learning'],
    embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1), // Mock embedding for dev
  },
  {
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
    authors: ['Devlin, J.', 'Chang, M.', 'Lee, K.', 'Toutanova, K.'],
    year: 2019,
    domain: 'Computer Science & AI',
    source: 'arxiv',
    externalId: '1810.04805',
    url: 'https://arxiv.org/abs/1810.04805',
    citationCount: 75000,
    tags: ['bert', 'nlp', 'pretraining', 'transformers'],
    embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
  },
  {
    title: 'Deep Residual Learning for Image Recognition',
    abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.',
    authors: ['He, K.', 'Zhang, X.', 'Ren, S.', 'Sun, J.'],
    year: 2016,
    domain: 'Computer Science & AI',
    source: 'arxiv',
    externalId: '1512.03385',
    url: 'https://arxiv.org/abs/1512.03385',
    citationCount: 130000,
    tags: ['resnet', 'image recognition', 'deep learning', 'cnn'],
    embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
  },
  {
    title: 'CRISPR-Cas9 for medical genetic screens: applications and future perspectives',
    abstract: 'CRISPR-Cas9 has rapidly become the tool of choice for genome editing due to its simplicity, efficiency, and versatility. This review discusses the latest developments in CRISPR technology for medical genetic screens, including high-throughput loss-of-function screens, base editing, and prime editing approaches.',
    authors: ['Chen, S.', 'Sanjana, N.', 'Zheng, K.'],
    year: 2022,
    domain: 'Biotechnology',
    source: 'semantic_scholar',
    externalId: '10.1038/s41576-022-00521-7',
    url: 'https://doi.org/10.1038/s41576-022-00521-7',
    citationCount: 4200,
    tags: ['crispr', 'genome editing', 'genetic screens', 'cas9'],
    embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
  },
  {
    title: 'Federated Learning: Challenges, Methods, and Future Directions',
    abstract: 'Federated learning (FL) is a machine learning setting where many clients collaboratively train a model under the orchestration of a central server, while keeping the training data decentralized. This paper provides a comprehensive survey of federated learning including its challenges and recent advances.',
    authors: ['Li, T.', 'Sahu, A.', 'Talwalkar, A.', 'Smith, V.'],
    year: 2020,
    domain: 'Computer Science & AI',
    source: 'arxiv',
    externalId: '1908.07873',
    url: 'https://arxiv.org/abs/1908.07873',
    citationCount: 8900,
    tags: ['federated learning', 'distributed ml', 'privacy', 'machine learning'],
    embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
  },
];

const SAMPLE_PATENTS = [
  {
    patentNumber: 'US11,456,789',
    title: 'System and Method for Privacy-Preserving Machine Learning using Differential Privacy',
    abstract: 'A system and method for training machine learning models while preserving individual privacy using differential privacy mechanisms including Gaussian noise injection and gradient clipping.',
    inventors: ['Smith, John', 'Lee, Sarah'],
    assignee: 'Tech Corp Inc.',
    filingDate: new Date('2023-06-15'),
    publicationDate: new Date('2024-01-10'),
    status: 'granted',
    office: 'USPTO',
    domain: 'Computer Science & AI',
    tags: ['machine learning', 'privacy', 'differential privacy'],
    embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
  },
  {
    patentNumber: 'US2024/0123456',
    title: 'CRISPR-Based Diagnostic Device for Rapid Pathogen Identification',
    abstract: 'A portable diagnostic device utilizing CRISPR-Cas12 technology for rapid, sensitive, and specific identification of pathogens in clinical samples without requiring laboratory infrastructure.',
    inventors: ['Patel, Priya', 'Kim, Jae-Won'],
    assignee: 'BioTech Solutions Ltd.',
    filingDate: new Date('2024-01-20'),
    publicationDate: new Date('2024-07-25'),
    status: 'pending',
    office: 'USPTO',
    domain: 'Biotechnology',
    tags: ['crispr', 'diagnostics', 'pathogen detection'],
    embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
  },
];

const SAMPLE_ADMIN = {
  name: 'Admin User',
  email: 'admin@originai.dev',
  password: 'AdminPass123!',
  role: 'admin',
  institution: 'OriginAI',
  isVerified: true,
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing seed data
    await Promise.all([
      Paper.deleteMany({ source: { $in: ['arxiv', 'semantic_scholar'] } }),
      Patent.deleteMany({}),
      User.deleteMany({ email: SAMPLE_ADMIN.email }),
    ]);

    // Insert seed data
    await Paper.insertMany(SAMPLE_PAPERS);
    logger.info(`Seeded ${SAMPLE_PAPERS.length} papers`);

    await Patent.insertMany(SAMPLE_PATENTS);
    logger.info(`Seeded ${SAMPLE_PATENTS.length} patents`);

    await User.create(SAMPLE_ADMIN);
    logger.info(`Created admin user: ${SAMPLE_ADMIN.email} / ${SAMPLE_ADMIN.password}`);

    logger.info('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    logger.error(`Seeding failed: ${err.message}`);
    process.exit(1);
  }
};

seed();
