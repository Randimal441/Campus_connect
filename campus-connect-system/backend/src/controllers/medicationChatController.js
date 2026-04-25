const MedicationChat = require('../models/MedicationChatModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey =
  process.env.GEMINI_API_KEY_HIMANSHA ||
  process.env.GOOGLE_API_KEY ||
  process.env.GEMINI_API_KEY_Randimal;

const client = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey.trim()) : null;
const geminiModels = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-001',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
].filter(Boolean);

// System prompt for medication AI
const MEDICATION_SYSTEM_PROMPT = `You are a helpful sports medicine AI assistant. You provide quick tips and emergency medical guidance for sports-related injuries and health concerns.

IMPORTANT GUIDELINES:
- Provide QUICK TIPS for common sports injuries (sprains, strains, muscle soreness, etc.)
- Give EMERGENCY MEDICAL STEPS for serious conditions (head injuries, severe bleeding, chest pain, etc.)
- Always recommend consulting a doctor for serious issues
- Use clear, numbered steps for first aid
- Be empathetic and supportive
- DO NOT diagnose diseases - suggest seeing a healthcare professional
- Keep responses concise but informative
- Format with clear sections: QUICK TIPS, EMERGENCY STEPS (if needed), WHEN TO SEE A DOCTOR

Remember: You are NOT a substitute for professional medical advice.`;

/**
 * POST /api/medication-chat/send
 * Send a message to the medication chat and get AI response
 */
const sendMessage = async (req, res, next) => {
  try {
    const { clubId, message } = req.body;
    const userId = req.user?._id;
    const chatScope = String(clubId || 'medical-support');

    if (!userId || !message) {
      return res.status(400).json({
        error: 'Missing required fields: message',
      });
    }

    if (!client) {
      return res.status(500).json({
        error: 'Gemini API key is not configured on the server.',
      });
    }

    // Find or create chat history for this user+club
    let chat = await MedicationChat.findOne({ userId, clubId: chatScope });
    if (!chat) {
      chat = new MedicationChat({ userId, clubId: chatScope, messages: [] });
    }

    // Add user message to history
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Prepare conversation history for context
    const conversationHistory = chat.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Call Google Gemini API with model fallback to handle version/model mismatches.
    let response;
    let lastModelError;

    for (const modelName of geminiModels) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: MEDICATION_SYSTEM_PROMPT,
        });

        response = await model.generateContent({
          contents: conversationHistory,
        });
        lastModelError = null;
        break;
      } catch (modelError) {
        lastModelError = modelError;
        const msg = String(modelError?.message || '').toLowerCase();
        const isModelNotFound = msg.includes('not found') || msg.includes('not supported for generatecontent');
        const isTransientOverload =
          msg.includes('503') ||
          msg.includes('service unavailable') ||
          msg.includes('high demand') ||
          msg.includes('resource exhausted') ||
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('rate limit');

        // For model mismatch or temporary overload, try the next model in the list.
        if (!isModelNotFound && !isTransientOverload) {
          throw modelError;
        }
      }
    }

    if (!response) {
      throw lastModelError || new Error('No supported Gemini model is available for this API key.');
    }

    const aiResponseText =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Unable to generate a response. Please try again.';

    // Add AI response to history
    chat.messages.push({
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date(),
    });

    // Save updated chat
    await chat.save();

    res.json({
      success: true,
      message: aiResponseText,
      chatHistory: chat.messages,
    });
  } catch (error) {
    const rawMessage = String(error?.message || '');
    const lowerMessage = rawMessage.toLowerCase();

    if (
      lowerMessage.includes('api key') ||
      lowerMessage.includes('permission') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('authentication')
    ) {
      return res.status(500).json({
        error: 'Gemini API key is invalid or lacks permission. Please update backend .env key.',
      });
    }

    if (lowerMessage.includes('not found') || lowerMessage.includes('not supported for generatecontent')) {
      return res.status(500).json({
        error: 'Selected Gemini model is unavailable for this key/project. Set GEMINI_MODEL in backend .env to a supported model.',
      });
    }

    if (
      lowerMessage.includes('503') ||
      lowerMessage.includes('service unavailable') ||
      lowerMessage.includes('high demand') ||
      lowerMessage.includes('resource exhausted') ||
      lowerMessage.includes('429') ||
      lowerMessage.includes('quota') ||
      lowerMessage.includes('rate limit')
    ) {
      return res.status(503).json({
        error: 'Gemini is temporarily busy. Please try again in a few seconds.',
      });
    }

    return next(error);
  }
};

/**
 * GET /api/medication-chat/history/:userId/:clubId
 * Get chat history for a user in a specific club
 */
const getChatHistory = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const userId = req.user?._id;
    const chatScope = String(clubId || 'medical-support');

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameters',
      });
    }

    const chat = await MedicationChat.findOne({ userId, clubId: chatScope }).populate(
      'userId',
      'fullName email'
    );

    if (!chat) {
      return res.json({
        success: true,
        messages: [],
        message: 'No chat history found',
      });
    }

    res.json({
      success: true,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/medication-chat/clear/:userId/:clubId
 * Clear chat history for a user in a specific club
 */
const clearChatHistory = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const userId = req.user?._id;
    const chatScope = String(clubId || 'medical-support');

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameters',
      });
    }

    await MedicationChat.deleteOne({ userId, clubId: chatScope });

    res.json({
      success: true,
      message: 'Chat history cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  clearChatHistory,
};
