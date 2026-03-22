const express = require('express');
const {
  getAll,
  getUpcoming,
  getMyApplications,
  create,
  update,
  remove,
  attendEvent,
  applyForParticipation,
  updateOwnParticipationApplication,
  removeOwnParticipationApplication,
  updateApplicationStatus,
} = require('../controllers/eventsController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadEventImage } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/upcoming', getUpcoming);
router.get('/my-applications', protect, restrictTo('student'), getMyApplications);
router.get('/', protect, restrictTo('super_admin', 'event_coordinator'), getAll);
router.use(protect);
router.post(
  '/',
  restrictTo('super_admin', 'event_coordinator'),
  uploadEventImage.single('imageFile'),
  create
);
router.put(
  '/:id',
  restrictTo('super_admin', 'event_coordinator'),
  uploadEventImage.single('imageFile'),
  update
);
router.patch(
  '/:id',
  restrictTo('super_admin', 'event_coordinator'),
  uploadEventImage.single('imageFile'),
  update
);
router.patch(
  '/:id/applications/:applicationId/status',
  restrictTo('super_admin', 'event_coordinator'),
  updateApplicationStatus
);
router.patch(
  '/:id/applications/:applicationId',
  restrictTo('student'),
  updateOwnParticipationApplication
);
router.delete(
  '/:id/applications/:applicationId',
  restrictTo('student'),
  removeOwnParticipationApplication
);
router.delete('/:id', restrictTo('super_admin', 'event_coordinator'), remove);
router.post('/:id/attend', restrictTo('student'), attendEvent);
router.post('/:id/apply-participation', restrictTo('student'), applyForParticipation);

module.exports = router;
