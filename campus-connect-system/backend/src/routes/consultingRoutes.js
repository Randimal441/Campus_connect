const express = require('express');
const {getAllConsultants,getConsultantById,createSession,getSessionBookings,getPublicSessionsByCounselor,updateSession,deleteSession,getMentalHealthQuestions,bookSlot,cancelBooking,getMyBookings,getCounselorSessions} = require('../controllers/consultingController.js');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const router = express.Router();

// Public routes (students can see consultants)
router.get('/', getAllConsultants);             // list all consultants
router.get('/questions', getMentalHealthQuestions);  // fetch mental health questions
router.post('/sessions/:sessionId/slots/:slotId/book',protect,restrictTo('student'),bookSlot);   // book a slot (students only)
router.post('/sessions',protect,restrictTo('consultant'),createSession);
router.get('/sessions',protect,restrictTo('consultant'),getCounselorSessions)     // create session (consultants only)
router.get('/sessions/:sessionId/bookings',protect,restrictTo('consultant'),getSessionBookings);  //get respective consultant created session
router.put('/sessions/:sessionId',protect,restrictTo('consultant'),updateSession)  //update session
router.delete('/sessions/:sessionId',protect,restrictTo('consultant'),deleteSession)  //delete session
router.get('/sessions/public/:counselorId', getPublicSessionsByCounselor);  //get student view of consultant's sessions
router.get('/my-bookings', protect, restrictTo('student'), getMyBookings);
router.get('/:id', getConsultantById); //get consultant by id (for profile view)
router.delete('/sessions/:sessionId/slots/:slotId/cancel',protect,restrictTo('student'),cancelBooking)


module.exports = router;