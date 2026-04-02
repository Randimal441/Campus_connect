const ConsultingSession = require('../models/ConsultingSessionModel.js');
const { User } = require('../models/UserModel.js');

// ─── Gemini Setup (dynamic import for ESM-only package) ───────────────────────
// Lazily import the ESM package and initialize the client. This avoids requiring
// an ESM module from CommonJS and works without converting the whole project.
let genAIPromise = (async () => {
  const mod = await import('@google/genai');
  const { GoogleGenAI } = mod;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_HIMANSHA });
})();

const MENTAL_HEALTH_QUESTIONS = [
  'Over the last 2 weeks, how often have you felt down, hopeless, or empty?',
  'How often have you had little interest or pleasure in things you normally enjoy?',
  'How often have you felt nervous, anxious, or on edge?',
  'How would you rate your sleep quality lately? (Never = Very Good, Always = Very Poor)',
  'How often do you feel overwhelmed by your academic workload?',
  'Have you been avoiding social interactions or withdrawing from friends/family?',
  'How often do you feel you have no one to talk to about your problems?',
  'Have you had any thoughts of harming yourself or feeling life isn\'t worth living?',
];

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const hasTimeOverlap = (aStart, aEnd, bStart, bEnd) => {
  return aStart < bEnd && aEnd > bStart;
};

const findSessionOverlap = async ({ counselorId, day, startTime, endTime, excludeSessionId = null }) => {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  if (newStart === null || newEnd === null || newStart >= newEnd) {
    return { invalidTime: true, overlap: null };
  }

  const query = {
    counselor: counselorId,
    day,
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const sameDaySessions = await ConsultingSession.find(query)
    .select('startTime endTime')
    .lean();

  const overlap = sameDaySessions.find((session) => {
    const existingStart = timeToMinutes(session.startTime);
    const existingEnd = timeToMinutes(session.endTime);

    if (existingStart === null || existingEnd === null) {
      return false;
    }

    return hasTimeOverlap(newStart, newEnd, existingStart, existingEnd);
  });

  return { invalidTime: false, overlap: overlap || null };
};

// ─── GEMINI: Analyze mental status ───────────────────────────────────────────
const analyzeMentalStatus = async (answers) => {
  try {
    // 1. Using Gemini 3 Flash (Higher Free Tier limits and better JSON)
    const genAI = await genAIPromise;

    // const models = await genAI.models.list(); 
    // console.log("Available Models List:");
    // for await (const model of models) {
    //     console.log(model.name);
    // }

    const formatted = answers
      .map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer}`)
      .join('\n\n');

    const prompt = `You are a mental health risk assessment assistant. 
    Analyze these responses:
    ${formatted}

    Rules:
    - Determine risk level: "low", "medium", or "high".
    - If question 8 is "Often" or "Always", riskLevel MUST be "high".
    - Provide a 2-3 sentence summary for a counselor.
    
    Return ONLY JSON.`;

    // 2. Use the current models.generateContent API directly
    const result = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    console.log("FULL API RESPONSE:", JSON.stringify(result, null, 2));
    //const responseText = result.response.text();
    const responseText = result.candidates[0].content.parts[0].text;
    let cleanText = responseText.trim();

    if (cleanText.startsWith("```")) {
    cleanText = cleanText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
    }

const parsed = JSON.parse(cleanText);
    

    return {
      riskLevel: parsed.riskLevel || 'medium',
      riskSummary: parsed.riskSummary || parsed.summary || parsed.risk_summary || 'Summary generated, but keys were missing.'
    };

  } catch (error) {
    console.error('Gemini API error:', error.message);
    
    // Check if it's a rate limit error (Free Tier limit)
    if (error.message.includes('429')) {
       return { riskLevel: 'medium', riskSummary: `System busy. Manual assessment required. ${error.message}` };
    }

    return { riskLevel: 'medium', riskSummary: `AI analysis unavailable. Manual review required. ${error.message}` };
  }
};

const getMentalHealthQuestions = (req, res) => {
  res.status(200).json({ questions: MENTAL_HEALTH_QUESTIONS });
};


// Get all approved consultants
const getAllConsultants = async (req, res, next) => {
  try {
    const consultants = await User.find({
      role: 'consultant',
      isApproved: true,
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json(consultants);
  } catch (error) {
    next(error);
  }
};

// Get single consultant by ID
const getConsultantById = async (req, res, next) => {
  try {
    const consultant = await User.findOne({
      _id: req.params.id,
      role: 'consultant',
      isApproved: true,
    }).select('-password');

    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }

    res.status(200).json(consultant);
  } catch (error) {
    next(error);
  }
};


const createSession = async (req, res, next) => {
  try {
    const { day, startTime, endTime, place } = req.body;

    if (!day || !startTime || !endTime || !place) {
      return res.status(400).json({ message: 'day, startTime, endTime, and place are required.' });
    }

    const { invalidTime, overlap } = await findSessionOverlap({
      counselorId: req.user._id,
      day,
      startTime,
      endTime,
    });

    if (invalidTime) {
      return res.status(400).json({ message: 'Invalid time range. endTime must be after startTime.' });
    }

    if (overlap) {
      return res.status(409).json({
        message: `You already have a session on ${day} that overlaps (${overlap.startTime}-${overlap.endTime}). Please choose a different time.`,
      });
    }

    const slots = ConsultingSession.generateSlots(startTime, endTime);

    if (slots.length === 0) {
      return res.status(400).json({ message: 'Time range too small. Must allow at least one 30-minute slot.' });
    }

    const session = await ConsultingSession.create({
      counselor: req.user._id, // set by auth middleware
      counselorName: req.user.fullName, // denormalized for easier access
      day,
      startTime,
      endTime,
      place,
      slots,
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};


const getCounselorSessions = async (req, res, next) => {
  try {
    const sessions = await ConsultingSession.find({ counselor: req.user._id })
      .sort({ day: 1, startTime: 1 });
    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
};


const getSessionBookings = async (req, res, next) => {
  try {
    const session = await ConsultingSession.findOne({
      _id: req.params.sessionId,
      counselor: req.user._id,
    }).populate('slots.bookedBy', 'name email');

    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const bookings = session.slots.filter((s) => s.isBooked);
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};


const getPublicSessionsByCounselor = async (req, res, next) => {
  try {
    const sessions = await ConsultingSession.find({ 
      counselor: req.params.counselorId 
    }).sort({ day: 1, startTime: 1 });

    // Remove sensitive booking data before sending to students
    const safeSessions = sessions.map(session => ({
      _id:       session._id,
      day:       session.day,
      startTime: session.startTime,
      endTime:   session.endTime,
      place:     session.place,
      slots: session.slots.map(slot => ({
        _id:       slot._id,
        startTime: slot.startTime,
        endTime:   slot.endTime,
        isBooked:  slot.isBooked, 
        bookedBy: req.user && slot.bookedBy && slot.bookedBy.toString() === req.user._id.toString() ? slot.bookedBy : null,
      })),
    }));

    res.status(200).json(safeSessions);
  } catch (error) {
    next(error);
  }
};


const updateSession = async (req, res, next) => {
  try {
    const { day, startTime, endTime, place } = req.body;  // ← add day
    const session = await ConsultingSession.findOne({
      _id: req.params.sessionId,
      counselor: req.user._id,
    });

    if (!session) return res.status(404).json({ message: 'Session not found.' });

    // Check if any slot is already booked
    const hasBookings = session.slots.some((s) => s.isBooked);
    if (hasBookings) {
      return res.status(400).json({
        message: 'Cannot edit session: some slots are already booked.',
      });
    }

    if (day)       session.day       = day;        // ← add this
    if (startTime) session.startTime = startTime;
    if (endTime)   session.endTime   = endTime;
    if (place)     session.place     = place;

    const { invalidTime, overlap } = await findSessionOverlap({
      counselorId: req.user._id,
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
      excludeSessionId: session._id,
    });

    if (invalidTime) {
      return res.status(400).json({ message: 'Invalid time range. endTime must be after startTime.' });
    }

    if (overlap) {
      return res.status(409).json({
        message: `You already have another session on ${session.day} that overlaps (${overlap.startTime}-${overlap.endTime}). Please choose a different time.`,
      });
    }

    // Regenerate slots only if time changed
    if (startTime || endTime) {
      session.slots = ConsultingSession.generateSlots(session.startTime, session.endTime);
    }

    await session.save();
    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};


const deleteSession = async (req, res, next) => {
  try {
    const session = await ConsultingSession.findOneAndDelete({
      _id: req.params.sessionId,
      counselor: req.user._id,
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    res.status(200).json({ message: 'Session deleted.' });
  } catch (error) {
    next(error);
  }
};

const bookSlot = async (req, res, next) => {
  try {
    const { academicYear, emergencyContact, answers } = req.body;
    const { sessionId, slotId } = req.params;

    if (!academicYear || !emergencyContact || !answers || answers.length === 0) {
      return res.status(400).json({ message: 'academicYear, emergencyContact, and answers are required.' });
    }

    const session = await ConsultingSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const hasExistingBookingInSession = session.slots.some(
      (s) => s.isBooked && s.bookedBy && s.bookedBy.toString() === req.user._id.toString()
    );

    if (hasExistingBookingInSession) {
      return res.status(409).json({
        message: 'You have already booked a slot in this session.',
      });
    }

    const slot = session.slots.id(slotId);
    if (!slot)      return res.status(404).json({ message: 'Slot not found.' });
    if (slot.isBooked) return res.status(400).json({ message: 'Slot already booked.' });

    // Call Gemini to analyze mental status
    //following line comment to stop work of gemini api key
    const { riskLevel, riskSummary } = await analyzeMentalStatus(answers);


    // Use authenticated user info (fullName) for student name; avoid an extra DB call
    const studentName = req.user.fullName || 'Unknown';

    slot.isBooked  = true;
    slot.bookedBy  = req.user._id;
    slot.booking   = {
      studentName:          studentName,
      academicYear,
      emergencyContact,
      mentalStatusAnswers:  answers,
      riskLevel,
      riskSummary,
      bookedAt:             new Date(),
    };

    await session.save();

    res.status(200).json({
      message:    'Slot booked successfully.',
      riskLevel,
      riskSummary,
      slot,
    });
  } catch (error) {
    next(error);
  }
};


const cancelBooking = async (req, res, next) => {
  try {
    const { sessionId, slotId } = req.params;

    const session = await ConsultingSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const slot = session.slots.id(slotId);
    if (!slot)          return res.status(404).json({ message: 'Slot not found.' });
    if (!slot.isBooked) return res.status(400).json({ message: 'This slot is not booked.' });

    // Check the slot belongs to this student
    if (slot.bookedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own booking.' });
    }

    // Only allow cancellation if risk level is low
    if (slot.booking.riskLevel !== 'low') {
      return res.status(403).json({
        message: 'Cancellation not allowed. Your mental health risk level for this session is assessed as medium or high. Please contact your counselor directly if you need to reschedule.',
      });
    }

    // Clear the slot
    slot.isBooked  = false;
    slot.bookedBy  = null;
    slot.booking   = undefined;

    await session.save();

    res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    next(error);
  }
}


const getMyBookings = async (req, res, next) => {
  try {
    // Find all sessions that have at least one slot booked by this student
    const sessions = await ConsultingSession.find({
      'slots.bookedBy': req.user._id,
    }).populate('counselor', 'name email');

    if (!sessions.length) {
      return res.status(200).json([]);
    }

    // Extract only the slots that belong to this student
    const myBookings = [];

    sessions.forEach(session => {
      session.slots.forEach(slot => {
        if (slot.bookedBy && slot.bookedBy.toString() === req.user._id.toString()) {
          myBookings.push({
            sessionId:     session._id,
            slotId:        slot._id,
            day:           session.day,
            place:         session.place,
            slotStartTime: slot.startTime,
            slotEndTime:   slot.endTime,
            counselor: {
              id:    session.counselor._id,
              name:  session.counselorName,
              email: session.counselor.email,
            },
            booking: {
              academicYear:     slot.booking.academicYear,
              emergencyContact: slot.booking.emergencyContact,
              riskLevel:        slot.booking.riskLevel,
              riskSummary:      slot.booking.riskSummary,
              bookedAt:         slot.booking.bookedAt,
            },
          });
        }
      });
    });

    // Sort by day then slot start time (newest first)
    myBookings.sort((a, b) => {
      if (b.day !== a.day) return b.day.localeCompare(a.day);
      return b.slotStartTime.localeCompare(a.slotStartTime);
    });

    res.status(200).json(myBookings);
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMentalHealthQuestions,
  getAllConsultants,
  getConsultantById,
  getSessionBookings,
  getCounselorSessions,
  getPublicSessionsByCounselor,
  createSession,
  updateSession,
  deleteSession,
  bookSlot,
  cancelBooking,
  getMyBookings,
};