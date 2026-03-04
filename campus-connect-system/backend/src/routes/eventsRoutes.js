const express = require('express');
const {
  getAll,
  getUpcoming,
  create,
  update,
  remove,
  attendEvent,
} = require('../controllers/eventsController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadEventImage } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', getAll);
router.get('/upcoming', getUpcoming);
router.use(protect);
router.post(
  '/',
  restrictTo('event_coordinator', 'super_admin'),
  uploadEventImage.single('imageFile'),
  create
);
router.put(
  '/:id',
  restrictTo('event_coordinator', 'super_admin'),
  uploadEventImage.single('imageFile'),
  update
);
router.patch(
  '/:id',
  restrictTo('event_coordinator', 'super_admin'),
  uploadEventImage.single('imageFile'),
  update
);
router.delete('/:id', restrictTo('event_coordinator', 'super_admin'), remove);
router.post('/:id/attend', restrictTo('student'), attendEvent);

module.exports = router;
