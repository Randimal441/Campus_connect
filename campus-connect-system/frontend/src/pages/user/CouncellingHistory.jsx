import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { api } from '../../services/api';
import { toast } from 'react-toastify';

const heroImage =
  'https://images.herzindagi.info/image/2024/May/why-we-should-seek-therapist.jpg';

const getStatusClass = (status) => {
  if (status === 'Completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Upcoming') return 'bg-blue-100 text-blue-700';
  return 'bg-rose-100 text-rose-700';
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatSlotTime = (hhmm) => {
  const [hourText = '0', minuteText = '0'] = (hhmm || '').split(':');
  const hour24 = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour24) || Number.isNaN(minute)) return hhmm || 'N/A';

  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
};

const getBookingStatus = (booking) => {
  if (booking?.localCancelled) return 'Cancelled';

  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const bookingDay = new Date(booking?.day);

  if (Number.isNaN(bookingDay.getTime())) return 'Completed';
  return bookingDay >= localToday ? 'Upcoming' : 'Completed';
};

const getRiskClass = (riskLevel) => {
  if (riskLevel === 'high') return 'bg-red-100 text-red-700';
  if (riskLevel === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
};

function BookingDetailsModal({ booking, onClose }) {
  if (!booking) return null;

  const status = getBookingStatus(booking);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Counseling Booking Details</h3>
            <p className="text-sm text-slate-500">Session ID: {booking.sessionId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <p><span className="font-semibold text-slate-900">Counselor:</span> {booking.counselor?.name || booking.counselor?.email || 'N/A'}</p>
          <p><span className="font-semibold text-slate-900">Status:</span> <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusClass(status)}`}>{status}</span></p>
          <p><span className="font-semibold text-slate-900">Date:</span> {formatDate(booking.day)}</p>
          <p><span className="font-semibold text-slate-900">Time:</span> {formatSlotTime(booking.slotStartTime)} - {formatSlotTime(booking.slotEndTime)}</p>
          <p><span className="font-semibold text-slate-900">Place:</span> {booking.place || 'N/A'}</p>
          <p><span className="font-semibold text-slate-900">Slot ID:</span> {booking.slotId}</p>
          <p><span className="font-semibold text-slate-900">Academic Year:</span> {booking.booking?.academicYear || 'N/A'}</p>
          <p><span className="font-semibold text-slate-900">Emergency Contact:</span> {booking.booking?.emergencyContact || 'N/A'}</p>
          <p>
            <span className="font-semibold text-slate-900">Risk Level:</span>{' '}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getRiskClass(booking.booking?.riskLevel)}`}>
              {(booking.booking?.riskLevel || 'low').toUpperCase()}
            </span>
          </p>
          <p><span className="font-semibold text-slate-900">Booked At:</span> {booking.booking?.bookedAt ? formatDateTime(booking.booking.bookedAt) : 'N/A'}</p>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Summary</p>
          <p className="text-sm leading-relaxed text-slate-700">{booking.booking?.riskSummary || 'No risk summary available.'}</p>
        </div>
      </div>
    </div>
  );
}

function CancelConfirmationModal({ booking, onClose, onConfirm, isSubmitting }) {
  if (!booking) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isSubmitting) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900">Cancel Upcoming Session</h3>
        <p className="mt-3 text-sm text-slate-600">
          Are you sure you want to cancel this upcoming session?
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {booking.counselor?.name || booking.counselor?.email || 'Counselor'} session on {formatDate(booking.day)} at{' '}
          {formatSlotTime(booking.slotStartTime)} - {formatSlotTime(booking.slotEndTime)}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep Session
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CouncellingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoadingId, setCancelLoadingId] = useState('');
  const [pendingCancelBooking, setPendingCancelBooking] = useState(null);

  const handleCancelSession = (booking) => {
    setPendingCancelBooking(booking);
  };

  const confirmCancelSession = async () => {
    if (!pendingCancelBooking) return;

    const booking = pendingCancelBooking;

    const requestId = `${booking.sessionId}-${booking.slotId}`;
    setCancelLoadingId(requestId);

    try {
      await api(`/consulting/sessions/${booking.sessionId}/slots/${booking.slotId}/cancel`, {
        method: 'DELETE',
      });

      setBookings((prev) =>
        prev.map((item) =>
          item.sessionId === booking.sessionId && item.slotId === booking.slotId
            ? { ...item, localCancelled: true }
            : item
        )
      );
      toast.success('Session cancelled successfully.');
      setPendingCancelBooking(null);
    } catch (cancelError) {
      toast.error(cancelError.message || 'Failed to cancel this session. Please try again.');
    } finally {
      setCancelLoadingId('');
    }
  };

  useEffect(() => {
    let mounted = true;

    api('/consulting/my-bookings')
      .then((data) => {
        if (!mounted) return;

        const list = Array.isArray(data) ? data : [];
        const sorted = [...list].sort((a, b) => {
          const aTime = new Date(a.booking?.bookedAt || a.day || 0).getTime();
          const bTime = new Date(b.booking?.bookedAt || b.day || 0).getTime();
          return bTime - aTime;
        });

        setBookings(sorted);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(fetchError.message || 'Failed to load booking history.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const completed = bookings.filter((item) => getBookingStatus(item) === 'Completed').length;
    const upcoming = bookings.filter((item) => getBookingStatus(item) === 'Upcoming').length;
    const highRisk = bookings.filter((item) => item.booking?.riskLevel === 'high').length;

    return {
      total: bookings.length,
      completed,
      upcoming,
      highRisk,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      const status = getBookingStatus(item);
      const matchStatus = selectedStatus === 'All' || status === selectedStatus;
      const text = `${item.sessionId} ${item.slotId} ${item.counselor?.email || ''} ${item.place || ''}`.toLowerCase();
      const matchSearch = text.includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [bookings, searchTerm, selectedStatus]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 py-16">
        <div className="pointer-events-none absolute -top-20 -left-24 h-64 w-64 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <span className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700">
              Student Wellness Portal
            </span>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Your Counseling
              <span className="block text-emerald-600">Booking History</span>
            </h1>
            <p className="mb-8 max-w-xl text-lg text-slate-600">
              Track completed and upcoming sessions, check counselor details,
              and review risk summaries anytime from your student dashboard.
            </p>
            <a
              href="#history-section"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-emerald-700"
            >
              View My History
            </a>
          </div>

          <div>
            <img
              src={heroImage}
              alt="Student counseling session"
              className="mx-auto w-full max-w-md rounded-3xl object-cover shadow-2xl ring-1 ring-slate-200"
            />
          </div>
        </div>
      </section>

      <main id="history-section" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Bookings</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">Completed</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.completed}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm text-blue-700">Upcoming</p>
            <p className="mt-2 text-2xl font-bold text-blue-800">{stats.upcoming}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm text-rose-700">High Risk Cases</p>
            <p className="mt-2 text-2xl font-bold text-rose-800">{stats.highRisk}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by counselor email, session ID, slot ID, or place"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none ring-emerald-200 transition focus:ring md:max-w-sm"
          />

          <div className="flex flex-wrap gap-2">
            {['All', 'Upcoming', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  selectedStatus === status
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading booking history...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              {error}
            </div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <article
                key={booking.slotId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">Counsellor: {booking.counselor?.name || booking.counselor?.email || 'Counselor'}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(getBookingStatus(booking))}`}
                  >
                    {getBookingStatus(booking)}
                  </span>
                </div>

                <p className="mb-3 text-sm text-slate-600">Session at {booking.place || 'Unknown location'}</p>

                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    <span className="font-medium text-slate-800">Session ID:</span> {booking.sessionId}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Date:</span> {formatDate(booking.day)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Time:</span>{' '}
                    {formatSlotTime(booking.slotStartTime)} - {formatSlotTime(booking.slotEndTime)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Risk:</span>{' '}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getRiskClass(booking.booking?.riskLevel)}`}>
                      {(booking.booking?.riskLevel || 'low').toUpperCase()}
                    </span>
                  </p>
                </div>

                <p className="mt-4 line-clamp-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  {booking.booking?.riskSummary || 'No summary available.'}
                </p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Booked at: {booking.booking?.bookedAt ? formatDateTime(booking.booking.bookedAt) : 'N/A'}
                  </p>
                  <div className="flex items-center gap-2">
                    {getBookingStatus(booking) === 'Upcoming' ? (
                      <button
                        type="button"
                        onClick={() => handleCancelSession(booking)}
                        disabled={cancelLoadingId === `${booking.sessionId}-${booking.slotId}`}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancelLoadingId === `${booking.sessionId}-${booking.slotId}` ? 'Cancelling...' : 'Cancel Session'}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No bookings match your filters.
            </div>
          )}
        </div>
      </main>

      <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      <CancelConfirmationModal
        booking={pendingCancelBooking}
        onClose={() => setPendingCancelBooking(null)}
        onConfirm={confirmCancelSession}
        isSubmitting={
          !!pendingCancelBooking &&
          cancelLoadingId === `${pendingCancelBooking.sessionId}-${pendingCancelBooking.slotId}`
        }
      />

      <Footer />
    </div>
  );
}
