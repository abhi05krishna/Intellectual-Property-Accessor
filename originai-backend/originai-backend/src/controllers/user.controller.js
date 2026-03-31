const User = require('../models/user.model');
const Analysis = require('../models/analysis.model');
const AppError = require('../utils/appError');

const ALLOWED_UPDATE_FIELDS = ['name', 'institution', 'domain', 'avatar'];

/**
 * GET /api/users/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/profile
 * Update allowed profile fields only.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Block password updates here — use /auth/change-password
    if (req.body.password) return next(new AppError('Use /auth/change-password to update your password.', 400));

    const updates = {};
    ALLOWED_UPDATE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/profile
 * Soft delete — deactivates account.
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ success: true, message: 'Account deactivated successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users  [Admin only]
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const filter = role ? { role } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (err) {
    next(err);
  }
};
