const express = require('express');
const router = express.Router();
const patentController = require('../controllers/patent.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.get('/', protect, patentController.getPatents);
router.get('/:id', protect, patentController.getPatent);
router.post('/ingest', protect, restrictTo('admin'), patentController.triggerIngestion);

module.exports = router;
