// paper.routes.js
const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paper.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.get('/', protect, paperController.getPapers);
router.get('/stats', protect, paperController.getCorpusStats);
router.post('/ingest/arxiv', protect, restrictTo('admin'), paperController.ingestArxiv);
router.post('/ingest/semantic-scholar', protect, restrictTo('admin'), paperController.ingestSemanticScholar);

module.exports = router;
