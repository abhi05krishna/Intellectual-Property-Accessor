const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload, handleUploadError } = require('../middleware/upload.middleware');

// All analysis routes require authentication
router.use(protect);

// Submit — accepts optional file upload
router.post(
  '/submit',
  upload.single('document'),
  handleUploadError,
  analysisController.submitAnalysis
);

// List user's analyses
router.get('/', analysisController.getUserAnalyses);

// Single analysis
router.get('/:id', analysisController.getAnalysis);

// Lightweight status poll
router.get('/:id/status', analysisController.getAnalysisStatus);

// Export as JSON report
router.get('/:id/export', analysisController.exportAnalysis);

// Delete
router.delete('/:id', analysisController.deleteAnalysis);

module.exports = router;
