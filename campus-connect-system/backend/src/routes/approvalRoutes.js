const express = require('express');
const {
  getPendingUsers,
  approveUser,
  rejectUser,
} = require('../controllers/approvalController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('super_admin'));

router.get('/pending', getPendingUsers);
router.patch('/:id/approve', approveUser);
router.delete('/:id/reject', rejectUser);

module.exports = router;
