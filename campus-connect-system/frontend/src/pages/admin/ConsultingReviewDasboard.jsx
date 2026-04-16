import React from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';

function ConsultantCard({ consultant, index }) {
  return (
    <article
      className="animate-fade-in group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-orange-300 to-teal-300" />

      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-orange-300 shadow-sm ring-4 ring-white">
          <svg className="h-10 w-10 text-amber-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
          <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 ring-4 ring-white">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        </div>

        <div className="mt-3">
          <p className="text-sm font-semibold text-slate-900">{consultant.fullName}</p>
          <p className="mt-0.5 text-xs font-medium text-teal-600">{consultant.specialty || consultant.specialization || 'Consultant'}</p>
          <p className="mt-0.5 text-xs text-slate-400">{consultant.location || 'Campus Wellness Center'}</p>
        </div>
      </div>

      <p
        className="mt-4 text-xs leading-5 text-slate-500"
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
        }}
      >
        {consultant.bio || 'Provides compassionate and evidence-based support for student well-being.'}
      </p>
    </article>
  );
}

function ReviewModal({ review, onClose }) {
  if (!review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition"
        >
          <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Review Details</h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Consultant Name</p>
              <p className="mt-1 text-sm text-slate-900">{review.consultantName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student Name</p>
              <p className="mt-1 text-sm text-slate-900">{review.studentName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rating</p>
              <p className="mt-1 text-sm text-slate-900">{review.rating} / 5</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full Review</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{review.text}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                    review.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : review.status === 'rejected'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {review.status === 'approved' ? 'Approved' : review.status === 'rejected' ? 'Rejected' : 'Pending'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConsultingReviewDashboard() {
  const [consultants, setConsultants] = React.useState([]);
  const [reviews, setReviews] = React.useState([]);
  const [selectedReview, setSelectedReview] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [consultantsRes, reviewsRes] = await Promise.all([
        api('/consulting'),
        api('/consulting/reviews/moderation'),
      ]);
      setConsultants(consultantsRes || []);
      setReviews(reviewsRes || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load consulting review data.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (reviewId, status) => {
    setActionLoading(reviewId);
    try {
      const updated = await api(`/consulting/reviews/moderation/${reviewId}/status`, {
        method: 'PATCH',
        body: { status },
      });

      setReviews((prev) => prev.map((review) => (review._id === reviewId ? updated : review)));
      toast.success(`Review ${status}.`);
    } catch (error) {
      toast.error(error.message || 'Failed to update review status.');
    } finally {
      setActionLoading(null);
    }
  };

  const visibleReviews = React.useMemo(() => {
    if (statusFilter === 'all') return reviews;
    return reviews.filter((review) => review.status === statusFilter);
  }, [reviews, statusFilter]);

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Available Consultants</h1>

      <section aria-label="Available consultants" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {consultants.map((consultant, index) => (
          <ConsultantCard key={consultant._id} consultant={consultant} index={index} />
        ))}
      </section>

      <div className="mt-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-900">Review & Approve</h2>
          <div className="flex items-center gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  statusFilter === status
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Consultant Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Review
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">Loading reviews...</td>
                </tr>
              ) : visibleReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No reviews found.</td>
                </tr>
              ) : (
                visibleReviews.map((review) => (
                  <tr key={review._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{review.consultantName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{review.studentName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{review.rating} / 5</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="text-teal-600 hover:text-teal-700 hover:underline font-medium truncate max-w-xs"
                      >
                        View Details
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {review.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(review._id, 'approved')}
                              disabled={actionLoading === review._id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(review._id, 'rejected')}
                              disabled={actionLoading === review._id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-100 hover:bg-red-100 transition disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                              review.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                          >
                            {review.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />
    </div>
  );
}
