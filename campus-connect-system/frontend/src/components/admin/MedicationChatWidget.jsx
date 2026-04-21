import { useState, useEffect, useRef } from 'react';
import { medicationChatService } from '../../services/medicationChatService';
import Loader from '../common/Loader';

export default function MedicationChatWidget({ userId, clubId, clubName }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, [userId, clubId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      setInitialLoading(true);
      const response = await medicationChatService.getChatHistory(
        userId,
        clubId
      );
      if (response.messages && response.messages.length > 0) {
        setMessages(response.messages);
      }
      setError('');
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setLoading(true);
    setError('');

    try {
      const response = await medicationChatService.sendMessage(
        userId,
        clubId,
        userMessage
      );

      if (response.success && response.chatHistory) {
        setMessages(response.chatHistory);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(
        err.response?.data?.error || 'Failed to send message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdfBlob = await medicationChatService.exportToPDF(
        messages,
        clubName,
        'Student'
      );

      const element = document.createElement('a');
      const fileUrl = URL.createObjectURL(
        new Blob([pdfBlob], { type: 'application/pdf' })
      );
      element.href = fileUrl;
      element.download = `medication-chat-${new Date().getTime()}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error('Error exporting chat:', err);
      setError('Failed to export chat');
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all chat history?')) {
      try {
        await medicationChatService.clearChatHistory(userId, clubId);
        setMessages([]);
        setError('');
      } catch (err) {
        console.error('Error clearing chat:', err);
        setError('Failed to clear chat history');
      }
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-1">🏥 Medication & Sports Injury AI Chat</h2>
        <p className="text-blue-100">Get quick tips & emergency guidance for sports-related health concerns</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="bg-white rounded-lg p-8 shadow-md max-w-md">
              <p className="text-gray-600 mb-2 text-lg">👋 Welcome to Medication Chat!</p>
              <p className="text-gray-500 text-sm mb-4">
                Ask about sports injuries, first aid tips, or health concerns related to athletics.
              </p>
              <p className="text-gray-400 text-xs">Start typing your question below...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-md lg:max-w-lg xl:max-w-2xl px-4 py-3 rounded-lg shadow-md ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                  }`}
                >
                  <div className="text-sm">
                    {msg.role === 'assistant' && (
                      <p className="font-bold text-indigo-600 mb-2">🤖 Medical Bot:</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p
                    className={`text-xs mt-2 ${
                      msg.role === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-300 p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about a sports injury or health concern..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              {loading ? <Loader /> : '📤 Send'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={messages.length === 0}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
              >
                📥 Export Chat
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                disabled={messages.length === 0}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
              >
                🗑️ Clear Chat
              </button>
            </div>
            <p className="text-xs text-gray-500 self-center">
              Messages: {messages.length}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
