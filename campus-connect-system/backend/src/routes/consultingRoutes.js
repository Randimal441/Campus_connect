const express = require('express');
const {
  getAll,
  create,
  bookSession,
  update,
  remove,
} = require('../controllers/consultingController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', getAll);
router.use(protect);
router.post('/', restrictTo('consultant', 'super_admin'), create);
router.patch('/:id/book', restrictTo('student'), bookSession);
router.patch('/:id', restrictTo('consultant', 'super_admin'), update);
router.delete('/:id', restrictTo('consultant', 'super_admin'), remove);

module.exports = router;
