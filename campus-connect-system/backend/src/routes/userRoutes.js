const express = require('express');
const { getAllUsers, getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/admin/all', restrictTo('super_admin'), getAllUsers);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

module.exports = router;
