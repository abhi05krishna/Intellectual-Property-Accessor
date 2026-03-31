const Patent = require('../models/patent.model');
const { ingestFromUSPTO } = require('../services/ingestion.service');
const AppError = require('../utils/appError');

/**
 * GET /api/patents
 * Paginated list of patents with optional filters.
 */
exports.getPatents = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, domain, office, status, q,
    } = req.query;

    const filter = {};
    if (domain) filter.domain = domain;
    if (office) filter.office = office;
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [patents, total] = await Promise.all([
      Patent.find(filter)
        .select('-embedding')
        .sort({ publicationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Patent.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        patents,
        pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/patents/:id
 */
exports.getPatent = async (req, res, next) => {
  try {
    const patent = await Patent.findById(req.params.id).select('-embedding');
    if (!patent) return next(new AppError('Patent not found.', 404));
    res.json({ success: true, data: { patent } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/patents/ingest  [Admin only]
 * Trigger USPTO ingestion for a keyword + domain.
 */
exports.triggerIngestion = async (req, res, next) => {
  try {
    const { keyword, domain, limit = 50 } = req.body;
    if (!keyword || !domain) return next(new AppError('keyword and domain are required.', 400));

    const count = await ingestFromUSPTO(keyword, domain, limit);
    res.json({ success: true, message: `Ingested ${count} patents.` });
  } catch (err) {
    next(err);
  }
};
