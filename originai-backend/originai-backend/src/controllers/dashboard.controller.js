const Analysis = require('../models/analysis.model');
const Patent = require('../models/patent.model');

/**
 * GET /api/dashboard
 * Full dashboard data for the authenticated user.
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalAnalyses,
      completedAnalyses,
      scoreAggregation,
      recentAnalyses,
      domainBreakdown,
      recentPatents,
      trendData,
    ] = await Promise.all([
      Analysis.countDocuments({ user: userId }),
      Analysis.countDocuments({ user: userId, status: 'completed' }),
      Analysis.aggregate([
        { $match: { user: userId, status: 'completed' } },
        {
          $group: {
            _id: null,
            avgOriginality: { $avg: '$scores.originality' },
            avgSimilarity: { $avg: '$scores.similarity' },
            avgNovelty: { $avg: '$scores.noveltyPotential' },
            highNoveltyCount: {
              $sum: { $cond: [{ $gte: ['$scores.noveltyPotential', 80] }, 1, 0] },
            },
            patentConflicts: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ['$similarWorks', []] },
                            as: 'w',
                            cond: { $eq: ['$$w.source', 'patent'] },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Analysis.find({ user: userId })
        .select('title domain scores status createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Analysis.aggregate([
        { $match: { user: userId, status: 'completed' } },
        { $group: { _id: '$domain', count: { $sum: 1 }, avgOriginality: { $avg: '$scores.originality' } } },
        { $sort: { count: -1 } },
      ]),
      Patent.find().select('-embedding').sort({ publicationDate: -1 }).limit(6),
      // Monthly trend — last 6 months
      Analysis.aggregate([
        { $match: { user: userId, status: 'completed' } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            avgOriginality: { $avg: '$scores.originality' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 },
      ]),
    ]);

    const agg = scoreAggregation[0] || {};

    res.json({
      success: true,
      data: {
        stats: {
          totalAnalyses,
          completedAnalyses,
          avgOriginality: Math.round(agg.avgOriginality || 0),
          avgSimilarity: Math.round(agg.avgSimilarity || 0),
          avgNovelty: Math.round(agg.avgNovelty || 0),
          highNoveltyCount: agg.highNoveltyCount || 0,
          patentConflicts: agg.patentConflicts || 0,
          fieldsExplored: domainBreakdown.length,
        },
        recentAnalyses,
        domainBreakdown,
        recentPatents,
        trendData: trendData.map(t => ({
          label: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
          avgOriginality: Math.round(t.avgOriginality),
          count: t.count,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};
