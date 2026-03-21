const express = require('express');
const {
  getAll,
  getUpcoming,
  create,
  update,
  remove,
  attendEvent,
  applyForParticipation,
} = require('../controllers/eventsController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadEventImage } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/upcoming', getUpcoming);
router.get('/', protect, restrictTo('super_admin'), getAll);
router.use(protect);
router.post(
  '/',
  restrictTo('super_admin'),
  uploadEventImage.single('imageFile'),
  create
);
router.put(
  '/:id',
  restrictTo('super_admin'),
  uploadEventImage.single('imageFile'),
  update
);
router.patch(
  '/:id',
  restrictTo('super_admin'),
  uploadEventImage.single('imageFile'),
  update
);
router.delete('/:id', restrictTo('super_admin'), remove);
router.post('/:id/attend', restrictTo('student'), attendEvent);
router.post('/:id/apply-participation', restrictTo('student'), applyForParticipation);

module.exports = router;
