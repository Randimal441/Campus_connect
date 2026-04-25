import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { medicationChatService } from '../../services/medicationChatService';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function MedicleSupport() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Welcome to Medical Support. I can help you with sports injury tips, emergency medical guidance, and medication-related questions.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);

  // Load chat history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?._id) return;
      try {
        const response = await medicationChatService.getChatHistory(
          user._id,
          'medical-support'
        );
        if (response.messages && response.messages.length > 0) {
          // Map stored format to display format
          const formattedMessages = response.messages.map((msg) => ({
            role: msg.role,
            text: msg.content,
          }));
          setMessages([
            {
              role: 'assistant',
              text: 'Welcome to Medical Support. I can help you with sports injury tips, emergency medical guidance, and medication-related questions.',
            },
            ...formattedMessages,
          ]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadHistory();
  }, [user]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || !user?._id) return;

    // Add user message to UI immediately
    const userMsg = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call backend API
      const response = await medicationChatService.sendMessage(
        user._id,
        'medical-support',
        trimmed
      );

      if (response.message) {
        const botMsg = { role: 'assistant', text: response.message };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const backendMessage =
        error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Sorry, I encountered an error. Please try again.';
      const errorMsg = {
        role: 'assistant',
        text: backendMessage,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const chatForExport = messages
        .filter((m) => m.role !== 'assistant' || m.text !== messages[0].text) // Exclude welcome message
        .slice(1); // Skip the initial welcome message

      const pdfBlob = await medicationChatService.exportToPDF(
        chatForExport.map((msg) => ({
          role: msg.role,
          content: msg.text,
          timestamp: new Date(),
        })),
        'Medical Support Chat',
        user?.fullName || 'Student'
      );

      const element = document.createElement('a');
      const fileUrl = URL.createObjectURL(
        new Blob([pdfBlob], { type: 'application/pdf' })
      );
      element.href = fileUrl;
      element.download = `medical-support-${new Date().getTime()}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error('Error exporting chat:', error);
    }
  };

  const handleClearChat = async () => {
    if (!user?._id) return;
    setClearingChat(true);
    try {
      await medicationChatService.clearChatHistory(user._id, 'medical-support');
      setMessages([
        {
          role: 'assistant',
          text: 'Welcome to Medical Support. I can help you with sports injury tips, emergency medical guidance, and medication-related questions.',
        },
      ]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing chat:', error);
    } finally {
      setClearingChat(false);
    }
  };

  return (
    <div className="page">
      <Navbar />

      <main className="main-content clubs-full-width">
        <div className="mb-6 animate-fade-in-up">
          <div className="mb-3">
            <Link to="/user/clubs-sports" className="btn btn-outline">
              ← Back to Clubs & Sports
            </Link>
          </div>

          <div className="flex flex-col items-center gap-3 mb-3 text-center">
            <div>
              <h1 className="mb-1">Medical Support</h1>
              <p className="lead !mb-0">AI-powered sports injury guidance & medication chat</p>
            </div>
          </div>

          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
            This chat provides educational support for sports injuries and medication questions. In emergencies, contact local emergency services immediately.
          </p>
        </div>

        <section className="max-w-4xl mx-auto w-full">
          <div className="card flex flex-col h-[500px] max-h-[70vh]">
            <div className="border-b border-border pb-3 mb-3">
              <h3>Medical Chat</h3>
              <p className="text-sm text-muted-foreground">Ask about sports injuries, emergency medical steps, and medication guidance using AI.</p>
            </div>

            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
              {messages.map((message, idx) => (
                <div
                  key={`${message.role}-${idx}`}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'ml-auto bg-primary text-white'
                      : 'bg-muted text-foreground border border-border'
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {loading && (
                <div className="bg-muted text-foreground border border-border rounded-2xl px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <form
              className="mt-4 border-t border-border pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
            >
              <label htmlFor="medicle-message" className="sr-only">
                Message
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="medicle-message"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about a sports injury or medication question..."
                  className="input flex-1"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-primary sm:w-auto"
                  disabled={!canSend}
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  type="button"
                  onClick={handleExport}
                  className="btn btn-outline text-xs"
                  disabled={messages.length <= 1}
                >
                  📥 Export Chat
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="btn btn-outline text-xs"
                  disabled={messages.length <= 1}
                >
                  🗑️ Clear Chat
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!clearingChat) setShowClearConfirm(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Clear chat history?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This will permanently remove all messages in this Medical Chat.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearingChat}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearChat}
                disabled={clearingChat}
              >
                {clearingChat ? 'Clearing...' : 'Yes, Clear Chat'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
