const express = require('express');
const {
  getAll,
  create,
  update,
  remove,
  attendEvent,
} = require('../controllers/eventsController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', getAll);
router.use(protect);
router.post('/', restrictTo('event_coordinator', 'super_admin'), create);
router.patch('/:id', restrictTo('event_coordinator', 'super_admin'), update);
router.delete('/:id', restrictTo('event_coordinator', 'super_admin'), remove);
router.post('/:id/attend', restrictTo('student'), attendEvent);

module.exports = router;
