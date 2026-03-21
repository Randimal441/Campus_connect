import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function BookingSessionModal({ onClose, onSessionCreated, onSessionUpdated, editingSession }) {
  const [day, setDay] = useState('');
  const [place, setPlace] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isEditMode = !!editingSession;

  useEffect(() => {
    if (editingSession) {
      setDay(editingSession.day || '');
      setPlace(editingSession.place || '');
      setStartTime(editingSession.startTime || '');
      setEndTime(editingSession.endTime || '');
    } else {
      setDay('');
      setPlace('');
      setStartTime('');
      setEndTime('');
    }
  }, [editingSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = { day, place, startTime, endTime };
      
      if (isEditMode) {
        // Update existing session
        const endpoint = `/consulting/sessions/${editingSession._id}`;
        const updated = await api(endpoint, { method: 'PUT', body });
        if (onSessionUpdated) onSessionUpdated(updated);
      } else {
        // Create new session
        const created = await api('/consulting/sessions', { method: 'POST', body });
        if (onSessionCreated) onSessionCreated(created);
      }
      onClose();
    } catch (err) {
      setError(err.message || `Unable to ${isEditMode ? 'update' : 'create'} session`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{isEditMode ? 'Edit Session' : 'New Booking Session'}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Date
            </label>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Location / Place
            </label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
          </div>


          {error && <p className="text-red-600 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {submitting ? (isEditMode ? 'Updating...' : 'Booking...') : (isEditMode ? 'Update Session' : 'Book Session')}
          </button>
        </form>
      </div>
    </div>
  );
}
