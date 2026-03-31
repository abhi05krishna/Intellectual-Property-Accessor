const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Analysis = require('../models/analysis.model');
const { runAnalysisPipeline } = require('../services/analysis.service');
const AppError = require('../utils/appError');
const logger = require('../config/logger');

// ── Text Extraction ──────────────────────────────────────────

const extractTextFromFile = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(file.path);
    const data = await pdfParse(buffer);
    return data.text.replace(/\s+/g, ' ').trim();
  }

  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(file.path, 'utf8').replace(/\s+/g, ' ').trim();
  }

  if (ext === '.docx') {
    // For production use mammoth: const mammoth = require('mammoth');
    // const result = await mammoth.extractRawText({ path: file.path });
    // return result.value;
    throw new AppError('DOCX parsing requires the mammoth package. Install it and uncomment the code.', 501);
  }

  throw new AppError(`Unsupported file type: ${ext}`, 400);
};

const cleanupFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) logger.warn(`Failed to delete temp file: ${filePath}`);
  });
};

// ── Controllers ──────────────────────────────────────────────

/**
 * POST /api/analysis/submit
 * Accepts either a file upload or raw abstract text.
 * Starts the analysis pipeline asynchronously.
 */
exports.submitAnalysis = async (req, res, next) => {
  try {
    const { abstract, title, domain, documentType, comparisonDatabase } = req.body;
    let finalAbstract = abstract?.trim();
    let uploadedFile = null;

    // Extract text from uploaded file if present
    if (req.file) {
      try {
        finalAbstract = await extractTextFromFile(req.file);
        uploadedFile = {
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
        };
      } finally {
        cleanupFile(req.file.path);
      }
    }

    if (!finalAbstract || finalAbstract.length < 50) {
      return next(new AppError('Please provide an abstract or document with at least 50 characters.', 400));
    }

    // Create analysis record
    const analysis = await Analysis.create({
      user: req.user._id,
      abstract: finalAbstract,
      title: title?.trim(),
      domain: domain || 'Other',
      documentType: documentType || 'abstract',
      comparisonDatabase: comparisonDatabase || 'all',
      uploadedFile,
      status: 'pending',
    });

    logger.info(`Analysis submitted: ${analysis._id} by user ${req.user._id}`);

    // Run pipeline asynchronously — client polls for results
    runAnalysisPipeline(analysis._id.toString()).catch(err =>
      logger.error(`Pipeline error for ${analysis._id}: ${err.message}`)
    );

    res.status(202).json({
      success: true,
      message: 'Analysis started. Poll the status endpoint for results.',
      data: {
        analysisId: analysis._id,
        status: analysis.status,
        estimatedTimeSeconds: 15,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analysis/:id/status
 * Lightweight poll endpoint — returns status + scores when complete.
 */
exports.getAnalysisStatus = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('status scores processingTimeMs errorMessage createdAt');

    if (!analysis) return next(new AppError('Analysis not found.', 404));

    res.json({
      success: true,
      data: {
        analysisId: analysis._id,
        status: analysis.status,
        scores: analysis.scores,
        processingTimeMs: analysis.processingTimeMs,
        errorMessage: analysis.errorMessage,
        createdAt: analysis.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analysis/:id
 * Full analysis result — all fields.
 */
exports.getAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('-embedding');

    if (!analysis) return next(new AppError('Analysis not found.', 404));
    if (analysis.status === 'processing' || analysis.status === 'pending') {
      return res.json({ success: true, data: { analysis, message: 'Still processing...' } });
    }

    res.json({ success: true, data: { analysis } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analysis
 * List all analyses for the authenticated user.
 */
exports.getUserAnalyses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      Analysis.find({ user: req.user._id })
        .select('-embedding -similarWorks -recommendations')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Analysis.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/analysis/:id
 */
exports.deleteAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!analysis) return next(new AppError('Analysis not found.', 404));
    res.json({ success: true, message: 'Analysis deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analysis/:id/export
 * Export analysis as a structured JSON report.
 */
exports.exportAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('-embedding').populate('user', 'name email institution');

    if (!analysis) return next(new AppError('Analysis not found.', 404));

    const report = {
      reportTitle: 'OriginAI Originality Report',
      generatedAt: new Date().toISOString(),
      submission: {
        title: analysis.title,
        domain: analysis.domain,
        documentType: analysis.documentType,
        submittedAt: analysis.createdAt,
        submittedBy: analysis.user?.name,
        institution: analysis.user?.institution,
      },
      scores: analysis.scores,
      aiSummary: analysis.aiSummary,
      similarWorks: analysis.similarWorks,
      recommendations: analysis.recommendations,
      metadata: {
        comparisonDatabase: analysis.comparisonDatabase,
        totalCompared: analysis.totalCompared,
        processingTimeMs: analysis.processingTimeMs,
        databaseSnapshot: analysis.databaseSnapshot,
      },
    };

    res.setHeader('Content-Disposition', `attachment; filename="originai-report-${analysis._id}.json"`);
    res.json(report);
  } catch (err) {
    next(err);
  }
};
