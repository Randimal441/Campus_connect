import { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { askAboutEvents } from '../../services/eventsService';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Ask me about upcoming events, dates, venues, participation roles, or what is open right now.',
  },
];

const getQuickPrompts = (events) => {
  const prompts = [
    'What events are coming up soon?',
    'Which event has the nearest date?',
  ];

  const firstEvent = Array.isArray(events) ? events[0] : null;
  if (firstEvent?.title) {
    prompts.unshift(`Tell me about ${firstEvent.title}`);
  }

  return prompts.slice(0, 3);
};

export default function EventsAskChat({ events = [] }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const quickPrompts = useMemo(() => getQuickPrompts(events), [events]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const appendMessage = (role, text) => {
    setMessages((prev) => [...prev, { id: `${role}-${Date.now()}-${Math.random()}`, role, text }]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const question = inputValue.trim();
    if (!question || sending) return;

    const history = messages.slice(-8).map((message) => ({
      role: message.role,
      text: message.text,
    }));

    setError('');
    appendMessage('user', question);
    setInputValue('');
    setSending(true);

    try {
      const response = await askAboutEvents({ question, history });
      appendMessage('assistant', response.answer);
    } catch (err) {
      setError(err.message || 'Unable to get an answer right now.');
      appendMessage('assistant', 'I could not reach the event assistant right now. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInputValue(prompt);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Campus Events Assistant</p>
            <p className="text-xs text-slate-500">Ask about dates, venues, roles, and participation details.</p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            Live events
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[90%] sm:max-w-[78%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`mb-1 text-[11px] font-semibold uppercase tracking-wide ${message.role === 'user' ? 'text-emerald-700' : 'text-slate-500'}`}>
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                {message.text}
              </div>
            </div>
          </div>
        ))}

        {sending ? (
          <div className="flex justify-start">
            <div className="max-w-[90%] sm:max-w-[78%]">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Assistant</div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                Thinking about the available events...
              </div>
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
        {quickPrompts.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <textarea
            rows={2}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Ask a question about events..."
            className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={sending || !inputValue.trim()}
            className="inline-flex h-[56px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-[120px]"
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}