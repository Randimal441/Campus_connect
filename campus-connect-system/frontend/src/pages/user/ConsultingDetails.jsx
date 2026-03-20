import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const DUMMY_REVIEWS = [
  { _id: 'r1', name: 'Emily H.', rating: 5, date: 'Feb 12, 2024', text: 'Very caring and professional.' },
  { _id: 'r2', name: 'Michael J.', rating: 5, date: 'Feb 8, 2024', text: 'Helped me a lot.' },
];

export default function ConsultantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consultant, setConsultant] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState(DUMMY_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [showBookingModalStep1, setShowBookingModalStep1] = useState(false);
  const [showBookingModalStep2, setShowBookingModalStep2] = useState(false);
  const [bookingContext, setBookingContext] = useState(null); // { sessionId, slotId }
  const [academicYear, setAcademicYear] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [riskPreview, setRiskPreview] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Fetch consultant profile and public sessions
    Promise.all([
      api(`/consulting/${id}`),
      api(`/consulting/sessions/public/${id}`),
    ])
      .then(([consultantData, sessionsData]) => {
        setConsultant(consultantData);
        setSessions(sessionsData || []);
      })
      .catch((err) => {
        console.error('Failed to load consultant details', err);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading) return (
    <div className="page">
      <Navbar />
      <main className="main-content py-12 text-center">Loading consultant...</main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Profile / Left column */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {consultant ? (
              <div className="flex flex-col items-center text-center mb-4">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center overflow-hidden border-2 border-white shadow">
                    <svg className="w-12 h-12 text-amber-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{consultant.fullName || consultant.name}</h2>
                <p className="text-teal-500 text-sm mt-1">{consultant.specialty || consultant.specialization || 'Consultant'}</p>
                <p className="text-gray-500 text-sm mt-2">{consultant.location || 'Location not specified'}</p>
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Experience:</strong> {consultant.yearsOfExperience || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p>Consultant not found.</p>
            )}
          </div>

          {/* Reviews / Right column header */}
          <div className="col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Reviews</h3>
              <div className="text-sm text-gray-600">{reviews.length} reviews</div>
            </div>

            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="border-b border-gray-50 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-gray-800">{r.name}</div>
                    <div className="text-sm text-gray-500">{r.date}</div>
                  </div>
                  <div className="text-sm text-yellow-400">{'★'.repeat(r.rating)}</div>
                  <p className="text-sm text-gray-600 mt-1">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking schedule below */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Sessions & Slots</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-500">No sessions available at the moment.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm text-gray-600">{session.day}</div>
                      <div className="text-sm text-gray-800 font-medium">{session.startTime} - {session.endTime} • {session.place}</div>
                    </div>
                    <div className="text-sm text-gray-500">Slots: {session.slots.length}</div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {session.slots.map((slot) => (
                      <div key={slot._id} className={`p-2 rounded-md text-center border ${slot.isBooked ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-teal-50 border-teal-100 text-teal-700'}`}>
                        <div className="text-sm font-medium">{slot.startTime} - {slot.endTime}</div>
                        <div className="text-xs mt-1">{slot.isBooked ? 'Booked' : 'Available'}</div>
                        {!slot.isBooked && (
                          <button
                            onClick={() => {
                              if (!user) return navigate('/auth/signin');
                              // open step 1 modal and set context
                              setBookingContext({ sessionId: session._id, slotId: slot._id, day: session.day, place: session.place, startTime: slot.startTime, endTime: slot.endTime });
                              setAcademicYear('');
                              setEmergencyContact('');
                              setAnswers([]);
                              setRiskPreview(null);
                              setShowBookingModalStep1(true);
                            }}
                            className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded"
                          >
                            Book
                          </button>
                        )}
                        {slot.isBooked && slot.bookedBy && String(user?._id) === String(slot.bookedBy) && (
                          <div className="mt-2">
                            <button
                              onClick={async () => {
                                if (!user) return navigate('/auth/signin');
                                setCancelLoading(slot._id);
                                try {
                                  const endpoint = `/consulting/sessions/${session._id}/slots/${slot._id}/cancel`;
                                  const res = await api(endpoint, { method: 'DELETE' });
                                  // update sessions: mark slot unbooked
                                  setSessions(prev => prev.map(s => {
                                    if (s._id !== session._id) return s;
                                    return {
                                      ...s,
                                      slots: s.slots.map(sl => sl._id === slot._id ? { ...sl, isBooked: false, bookedBy: null } : sl)
                                    };
                                  }));
                                  toast.success(res.message || 'Booking cancelled');
                                } catch (err) {
                                  console.error('Cancel failed', err);
                                  toast.error(err.message || 'Cancel failed');
                                } finally {
                                  setCancelLoading(null);
                                }
                              }}
                              disabled={cancelLoading === slot._id}
                              className="mt-1 text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                            >
                              {cancelLoading === slot._id ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Booking Modal Step 1: contact details and preview */}
      {showBookingModalStep1 && bookingContext && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40 p-4" aria-hidden={showBookingModalStep2 ? 'true' : 'false'}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Booking details</h3>
              <button onClick={() => setShowBookingModalStep1(false)} className="text-gray-400">✕</button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-600">Academic Year *</label>
                <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full border rounded px-2 py-2 mt-1" placeholder="e.g. 3rd year" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Emergency Contact *</label>
                <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className="w-full border rounded px-2 py-2 mt-1" placeholder="Phone or relative" />
              </div>

              {riskPreview && (
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">Risk preview: <span className={riskPreview.riskLevel === 'high' ? 'text-red-600' : riskPreview.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'}>{riskPreview.riskLevel}</span></p>
                  <p className="text-sm text-gray-600 mt-1">{riskPreview.riskSummary}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setShowBookingModalStep1(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
              <div className="flex items-center gap-2">
                {riskPreview ? (
                  <button
                    onClick={async () => {
                      if (!bookingContext) return;
                      if (!academicYear.trim() || !emergencyContact.trim()) {
                        toast.error('Please fill in all required fields: Academic Year and Emergency Contact.');
                        return;
                      }
                      setBookingLoading(true);
                      try {
                        const endpoint = `/consulting/sessions/${bookingContext.sessionId}/slots/${bookingContext.slotId}/book`;
                        const body = { academicYear, emergencyContact, answers };
                        const res = await api(endpoint, { method: 'POST', body });
                        // update sessions state: mark slot booked using response.slot
                        setSessions(prev => prev.map(s => {
                          if (s._id !== bookingContext.sessionId) return s;
                          return {
                            ...s,
                            slots: s.slots.map(sl => sl._id === bookingContext.slotId ? { ...sl, isBooked: true, booking: res.slot?.booking || {}, bookedBy: res.slot?.bookedBy } : sl)
                          };
                        }));
                        setShowBookingModalStep1(false);
                        setShowBookingModalStep2(false);
                        setRiskPreview(null);
                        setBookingContext(null);
                        toast.success(res.message || 'Booked');
                      } catch (err) {
                        console.error('Booking failed', err);
                        toast.error(err.message || 'Booking failed');
                      } finally {
                        setBookingLoading(false);
                      }
                    }}
                    disabled={bookingLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                ) : (
                  <button onClick={() => {
                    if (!academicYear.trim() || !emergencyContact.trim()) {
                      toast.error('Please fill in all required fields: Academic Year and Emergency Contact.');
                      return;
                    }
                    // fetch questions then open step 2 (hide step1)
                    api('/consulting/questions')
                      .then((res) => {
                        const qs = res.questions || [];
                        setQuestions(qs);
                        setAnswers(qs.map(q => ({ question: q, answer: '' }))); // initialize
                        setShowBookingModalStep1(false);
                        setShowBookingModalStep2(true);
                      })
                      .catch(() => {
                        // fallback to a small set
                        const qs = ['Over the last 2 weeks, how often have you felt down, hopeless, or empty?','How often do you feel overwhelmed?'];
                        setQuestions(qs);
                        setAnswers(qs.map(q => ({ question: q, answer: '' })));
                        setShowBookingModalStep1(false);
                        setShowBookingModalStep2(true);
                      });
                  }} className="px-4 py-2 bg-green-600 text-white rounded">Next</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal Step 2: questionnaire */}
      {showBookingModalStep2 && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Pre-Consultation Questionnaire</h3>
              <button onClick={() => setShowBookingModalStep2(false)} className="text-gray-400">✕</button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-auto">
              {questions.map((q, idx) => (
                <div key={idx}>
                  <label className="text-sm text-gray-700">{q} *</label>
                  <select value={answers[idx]?.answer || ''} onChange={(e) => {
                    const copy = [...answers];
                    copy[idx] = { question: q, answer: e.target.value };
                    setAnswers(copy);
                  }} className="w-full mt-1 border rounded px-2 py-2">
                    <option value="">Select an option</option>
                    <option value="Never">Never</option>
                    <option value="Rarely">Rarely</option>
                    <option value="Sometimes">Sometimes</option>
                    <option value="Often">Often</option>
                    <option value="Always">Always</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => { setShowBookingModalStep2(false); setShowBookingModalStep1(true); }} className="px-4 py-2 bg-gray-100 rounded">Back</button>
              <div>
                <button onClick={() => {
                  if (answers.some(a => !a.answer)) {
                    toast.error('Please answer all questions.');
                    return;
                  }
                  // simple client-side risk analysis
                  const answersOnly = answers.map(a => a.answer || '');
                  let risk = 'low';
                  const highTriggers = answersOnly.filter(a => a === 'Often' || a === 'Always');
                  if (answersOnly[7] === 'Often' || answersOnly[7] === 'Always') risk = 'high';
                  else if (highTriggers.length >= 2) risk = 'medium';

                  const summary = highTriggers.length > 0 ? 'Several responses indicate elevated symptoms; consider follow-up.' : 'Responses appear low-risk.';

                  setRiskPreview({ riskLevel: risk, riskSummary: summary });
                  // close step 2 and show step1 with preview
                  setShowBookingModalStep2(false);
                  setShowBookingModalStep1(true);
                }} className="px-4 py-2 bg-green-600 text-white rounded">Submit Answers</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}