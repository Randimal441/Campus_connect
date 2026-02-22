const express = require('express');
const {
  getAll,
  create,
  update,
  remove,
} = require('../controllers/resourceController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', getAll);
router.use(protect);
router.post('/', restrictTo('resource_coordinator', 'super_admin'), create);
router.patch('/:id', restrictTo('resource_coordinator', 'super_admin'), update);
router.delete('/:id', restrictTo('resource_coordinator', 'super_admin'), remove);

module.exports = router;
