const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChatHistory,
  clearChatHistory,
} = require('../controllers/medicationChatController');
const { protect } = require('../middlewares/authMiddleware');

// Protect all routes with auth middleware
router.use(protect);

// Send message and get AI response
router.post('/send', sendMessage);

// Get chat history for a user in a club
router.get('/history/:userId/:clubId', getChatHistory);

// Clear chat history
router.delete('/clear/:userId/:clubId', clearChatHistory);

module.exports = router;
