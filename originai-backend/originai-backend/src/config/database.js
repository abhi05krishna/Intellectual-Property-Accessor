const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Ensure vector search index exists on papers collection
    // Only run vector search in production (Atlas M10+)
    if (process.env.NODE_ENV === 'production') {
      await ensureVectorSearchIndex(conn.connection);
    }

  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Creates Atlas Vector Search index on the papers collection if it doesn't exist.
 * This requires MongoDB Atlas M10+ cluster with vector search enabled.
 *
 * Index definition targets the `embedding` field (1536-dim for OpenAI text-embedding-3-small).
 */
const ensureVectorSearchIndex = async (connection) => {
  try {
    const db = connection.db;
    const collection = db.collection('papers');

    const indexName = process.env.VECTOR_INDEX_NAME || 'papers_vector_index';

    // Check existing search indexes
    const indexes = await collection.listSearchIndexes().toArray().catch(() => []);
    const exists = indexes.some(idx => idx.name === indexName);

    if (!exists) {
      logger.info(`Creating vector search index: ${indexName}`);
      await collection.createSearchIndex({
        name: indexName,
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 1536,          // OpenAI text-embedding-3-small
              similarity: 'cosine',
            },
            {
              type: 'filter',
              path: 'domain',
            },
            {
              type: 'filter',
              path: 'year',
            },
            {
              type: 'filter',
              path: 'source',
            },
          ],
        },
      });
      logger.info(`Vector search index "${indexName}" created successfully`);
    } else {
      logger.info(`Vector search index "${indexName}" already exists`);
    }
  } catch (err) {
    // Non-fatal — vector search may not be available on free tier
    logger.warn(`Vector search index setup skipped: ${err.message}`);
  }
};

// Connection lifecycle events
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

module.exports = connectDB;
