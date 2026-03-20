import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BookingSessionModal from '../../components/admin/BookingSessionModal';
import { toast } from 'react-toastify';

const avatar = (initials, color = "bg-teal-500") => (
  <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
    {initials}
  </div>
);

const StarRating = ({ rating }) => (
  <span className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} className={`w-3 h-3 ${s <= rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </span>
);

const reviews = [
  { initials: "EH", color: "bg-pink-400", name: "Emily H.", rating: 5, date: "Feb 12, 2024", text: "Dr. Mitchell helped me work through my anxiety with such patience and understanding. Her approach is both professional and caring." },
  { initials: "MJ", color: "bg-blue-400", name: "Michael J.", rating: 5, date: "Feb 8, 2024", text: "Excellent therapist. The CBT techniques she taught me have been life changing. Highly recommend!" },
  { initials: "AL", color: "bg-purple-400", name: "Anna L.", rating: 4, date: "Feb 3, 2024", text: "Very knowledgeable and creates a safe space for healing. The couples therapy sessions really helped our relationship." },
];

export default function ConsultantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleNewSession = (newSession) => {
    // refresh session list after creation
    setSessions((prev) => [newSession, ...prev]);
    setEditingSession(null);
  };

  const handleEditSession = (sessionId) => {
    const session = sessions.find(s => s._id === sessionId);
    if (session) {
      setEditingSession(session);
      setShowBookingModal(true);
    }
  };

  const handleSessionUpdated = (updatedSession) => {
    // Update the session in the list
    setSessions((prev) => 
      prev.map((s) => s._id === updatedSession._id ? updatedSession : s)
    );
    setEditingSession(null);
  };

  const handleDeleteSession = async (sessionId) => {
    setDeleting(true);
    try {
      await api(`/consulting/sessions/${sessionId}`, { method: 'DELETE' });
      // Remove session from list
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      setDeletingSessionId(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return; // Still loading auth context
    }

    if (!user?._id) {
      // Auth loaded but no user logged in
      setProfileLoading(false);
      return;
    }

    // User is logged in, fetch their profile
    setProfileLoading(true);
    api(`/consulting/${user._id}`)
      .then((data) => {
        setProfile(data);
        setProfileLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch profile:', err);
        setProfile(null);
        setProfileLoading(false);
      });
  }, [user, authLoading]);

  useEffect(() => {
    api('/consulting/sessions')
      .then(setSessions)
      .catch((err) => {
        console.error('Failed to fetch sessions:', err);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 font-sans">
        <div className="w-full mx-auto space-y-4">
          {/* Top Row */}
          <div className="grid grid-cols-5 gap-4">
            {/* Profile Card */}
            <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              {profileLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-xs">Loading profile...</p>
                </div>
              ) : profile ? (
                <>
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
                    <h2 className="text-base font-semibold text-gray-800">{profile.fullName || 'Consultant'}</h2>
                    <p className="text-teal-500 text-xs font-medium mt-0.5">{profile.specialization || 'Professional'}</p>
                    <p className="text-gray-400 text-xs mt-1">{profile.location || 'Location not specified'}</p>
                    <p className="text-gray-400 text-xs">{profile.yearsOfExperience || 0} years experience</p>
                  </div>

                  {profile.specialties && profile.specialties.length > 0 && (
                    <div className="mb-3">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1.5">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.specialties.map((tag) => (
                          <span key={tag} className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-gray-500">
                    {profile.phone && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span>{profile.email}</span>
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-xs text-gray-400 mt-3 leading-relaxed border-t border-gray-50 pt-3">
                      {profile.bio}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-xs">Profile not available</p>
                </div>
              )}
            </div>

            {/* Reviews Card */}
            <div className="col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Reviews</h3>
                <div className="flex items-center gap-1.5">
                  <StarRating rating={4} />
                  <span className="text-sm font-bold text-gray-800">4.7</span>
                  <span className="text-xs text-gray-400">/ reviews</span>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2.5">
                      {avatar(r.initials, r.color)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">{r.name}</span>
                            <StarRating rating={r.rating} />
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{r.date}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{r.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Booking Schedule</h3>
                <p className="text-xs text-gray-400 mt-0.5">Upcoming appointments and available slots</p>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-8 h-8 bg-teal-500 hover:bg-teal-600 transition-colors rounded-full flex items-center justify-center shadow-sm"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No sessions created yet.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {sessions.map((session) => {
                  const booked = session.slots.filter((s) => s.isBooked).length;
                  const available = session.slots.filter((s) => !s.isBooked).length;
                  return (
                    <div key={session._id}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-left">
                            <div className="text-sm font-bold text-gray-800">{session.day}</div>
                            <div className="text-xs text-gray-400">{session.place}</div>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium">{booked} booked</span>
                            <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium">{available} available</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditSession(session._id)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                            title="Edit session"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingSessionId(session._id)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                            title="Delete session"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 ml-2">
                        {session.slots.map((slot) => (
                          <div key={slot._id} className="flex items-center gap-4">
                            <span className="text-xs text-gray-400 w-16 flex-shrink-0 font-medium">{slot.startTime}</span>
                            {!slot.isBooked ? (
                              <div 
                                onClick={() => setSelectedSlot({ ...slot, sessionId: session._id, day: session.day, place: session.place })}
                                className="flex-1 border border-dashed border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2 hover:border-teal-300 hover:bg-teal-50 transition-colors cursor-pointer group"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                <span className="text-xs text-gray-400 group-hover:text-teal-500 transition-colors">— Available</span>
                              </div>
                            ) : (
                              <div 
                                onClick={() => setSelectedSlot({ ...slot, sessionId: session._id, day: session.day, place: session.place })}
                                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors"
                              >
                                {slot.booking && (
                                  <>
                                    {avatar(slot.booking.studentName?.slice(0, 2) || "N/A", "bg-blue-400")}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-semibold text-gray-700">{slot.booking.studentName}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-500">Booking</span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-0.5">Risk Level: {slot.booking.riskLevel}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slot Details Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSlot(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Slot Details</h3>
              <button 
                onClick={() => setSelectedSlot(null)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold">Date</p>
                <p className="text-gray-800 font-medium">{selectedSlot.day}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold">Location</p>
                <p className="text-gray-800 font-medium">{selectedSlot.place}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold">Time</p>
                <p className="text-gray-800 font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold">Status</p>
                <p className={`font-medium ${selectedSlot.isBooked ? 'text-orange-600' : 'text-teal-600'}`}>
                  {selectedSlot.isBooked ? 'Booked' : 'Available'}
                </p>
              </div>

              {selectedSlot.isBooked && selectedSlot.booking && (
                <>
                  <div>
                    <p className="text-gray-400 uppercase text-xs font-semibold">Student Name</p>
                    <p className="text-gray-800 font-medium">{selectedSlot.booking.studentName}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 uppercase text-xs font-semibold">Academic Year</p>
                    <p className="text-gray-800 font-medium">{selectedSlot.booking.academicYear}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 uppercase text-xs font-semibold">Emergency Contact</p>
                    <p className="text-gray-800 font-medium">{selectedSlot.booking.emergencyContact}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 uppercase text-xs font-semibold">Risk Level</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedSlot.booking.riskLevel === 'high' ? 'bg-red-50 text-red-600' :
                      selectedSlot.booking.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {selectedSlot.booking.riskLevel}
                    </span>
                  </div>

                  <div>
                    <p className="text-gray-400 uppercase text-xs font-semibold">Risk Summary</p>
                    <p className="text-gray-800 text-sm leading-relaxed">{selectedSlot.booking.riskSummary}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 uppercase text-xs font-semibold">Booked At</p>
                    <p className="text-gray-800 font-medium">{new Date(selectedSlot.booking.bookedAt).toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => setSelectedSlot(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingSessionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Delete Session?</h3>
              <button
                onClick={() => setDeletingSessionId(null)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-6">Are you sure you want to delete this session? This action cannot be undone.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingSessionId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(deletingSessionId)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit session modal */}
      {showBookingModal && (
        <BookingSessionModal
          onClose={() => {
            setShowBookingModal(false);
            setEditingSession(null);
          }}
          onSessionCreated={handleNewSession}
          onSessionUpdated={handleSessionUpdated}
          editingSession={editingSession}
        />
      )}
    </>
  );
}
