import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

function buildAssistantReply(input) {
  const text = input.toLowerCase();

  if (text.includes('fever') || text.includes('headache')) {
    return 'For symptoms like headache and fever, note your temperature, hydration level, and symptom duration. If fever is high, persistent, or paired with severe symptoms, contact a medical professional promptly.';
  }

  if (text.includes('empty stomach') || text.includes('food')) {
    return 'Some medicines should be taken with food to reduce stomach irritation, while others work better on an empty stomach. Always check the medicine label or confirm with a pharmacist before changing timing.';
  }

  if (text.includes('side effect') || text.includes('dizzy') || text.includes('nausea')) {
    return 'Track when the side effect started, dose timing, and severity. Do not stop prescribed medication abruptly unless emergency symptoms appear. Reach out to your doctor or pharmacist for safe adjustments.';
  }

  if (text.includes('dose') || text.includes('missed')) {
    return 'If you miss a dose, follow the medicine instructions. Many medications allow taking the missed dose soon after, but some should be skipped if close to the next dose. Avoid double dosing unless directed by your clinician.';
  }

  return 'I can help you prepare safe questions for your doctor, understand medication timing basics, and track symptoms. Share your concern and I will suggest a clear checklist.';
}

export default function MedicleSupport() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Welcome to MEdicle Support. I can help you organize medication-related questions before you talk to a healthcare professional.',
    },
  ]);
  const [input, setInput] = useState('');

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = { role: 'user', text: trimmed };
    const botMsg = { role: 'assistant', text: buildAssistantReply(trimmed) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
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
              <h1 className="mb-1">MEdicle Support</h1>
              <p className="lead !mb-0">AI-assisted medication guidance chat</p>
            </div>
          </div>

          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            This chat is for educational support only and is not a medical diagnosis tool. In emergencies, contact local emergency services immediately.
          </p>
        </div>

        <section className="max-w-4xl mx-auto w-full">
          <div className="card flex flex-col h-[500px] max-h-[70vh]">
            <div className="border-b border-border pb-3 mb-3">
              <h3>Medication Chat</h3>
              <p className="text-sm text-muted-foreground">Ask about dosage routines, side-effect tracking, and doctor-visit preparation.</p>
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
                  placeholder="Describe your medication question..."
                  className="input flex-1"
                />
                <button type="submit" className="btn btn-primary sm:w-auto" disabled={!canSend}>
                  Send
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
