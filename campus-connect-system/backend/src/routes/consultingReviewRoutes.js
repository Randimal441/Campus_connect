const express = require('express');
const {
  getApprovedReviewsByConsultant,
  submitReview,
  getReviewsForModeration,
  updateReviewStatus,
} = require('../controllers/consultingReviewController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/consultant/:consultantId', getApprovedReviewsByConsultant);
router.post('/consultant/:consultantId', protect, restrictTo('student'), submitReview);
router.get('/moderation', protect, restrictTo('consultant', 'super_admin'), getReviewsForModeration);
router.patch('/moderation/:reviewId/status', protect, restrictTo('consultant', 'super_admin'), updateReviewStatus);

module.exports = router;