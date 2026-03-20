const express = require('express');
const {
  getAll,
  create,
  update,
  remove,
} = require('../controllers/clubsSportsController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', getAll);
router.use(protect);
router.post('/', restrictTo('coach', 'super_admin'), create);
router.patch('/:id', restrictTo('coach', 'super_admin'), update);
router.delete('/:id', restrictTo('coach', 'super_admin'), remove);

module.exports = router;
