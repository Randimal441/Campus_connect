import React from 'react';

const CONSULTANTS = [
  {
    id: 'consultant-1',
    name: 'Dr. Saman Rathnayaka',
    title: 'Licensed Clinical Psychologist',
    location: 'No 25,Thilaka Mawatha, Colombo 07',
    experience: '12 years experience',
    availability: 'Available today',
    avatarGradient: 'from-amber-200 via-orange-200 to-orange-300',
    iconColor: 'text-amber-700',
    accentBar: 'from-amber-300 via-orange-300 to-teal-300',
    phone: '(+94) 705578439',
    email: 'saman@gmail.com',
    specialties: ['Anxiety & Depression', 'Trauma Recovery', 'Couples Therapy', 'CBT'],
    bio: 'Dedicated to providing compassionate, evidence-based therapy to help individuals navigate life challenges and achieve lasting well-being.',
  },
  {
    id: 'consultant-2',
    name: 'Ms. Nethmi Kuruppuge',
    title: 'Student Wellness Consultant',
    location: 'No 25,Thilaka Mawatha, Colombo 07',
    experience: '9 years experience',
    availability: 'Open for booking',
    avatarGradient: 'from-sky-200 via-cyan-200 to-teal-300',
    iconColor: 'text-cyan-700',
    accentBar: 'from-sky-300 via-cyan-300 to-teal-300',
    phone: '(+94) 705578439',
    email: 'nethmi@gmail.com',
    specialties: ['Academic Stress', 'Career Guidance', 'Burnout Recovery', 'Mindfulness'],
    bio: 'Supports students and young professionals with practical strategies for stress management, confidence building, and healthy routines.',
  },
  {
    id: 'consultant-3',
    name: 'Mr. Ravindu Peris',
    title: 'Senior Counseling Specialist',
    location: 'No 25,Thilaka Mawatha, Colombo 07',
    experience: '8 years experience',
    availability: 'Few evening slots left',
    avatarGradient: 'from-violet-200 via-fuchsia-200 to-pink-300',
    iconColor: 'text-violet-700',
    accentBar: 'from-violet-300 via-fuchsia-300 to-pink-300',
    phone: '(+94) 705578439',
    email: 'ravindu@gmail.com',
    specialties: ['Exam Anxiety', 'Conflict Resolution', 'Confidence Building', 'Family Support'],
    bio: 'Works closely with clients to create a calm, structured path toward emotional clarity, resilience, and better day-to-day balance.',
  },
];

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11.04 11.04 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.71 21 3 14.29 3 6V5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ConsultantCard({ consultant, index }) {
  return (
    <article
      className="animate-fade-in group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${consultant.accentBar}`} />

      <div className="mb-4">
        <div className="flex flex-col items-center text-center">
          <div className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${consultant.avatarGradient} shadow-sm ring-4 ring-white`}>
            <svg className={`h-10 w-10 ${consultant.iconColor}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 ring-4 ring-white">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
          </div>

          <div className="mt-3">
            <p className="text-sm font-semibold text-slate-900">{consultant.name}</p>
            <p className="mt-0.5 text-xs font-medium text-teal-600">{consultant.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">{consultant.location}</p>
            <p className="text-xs text-slate-400">{consultant.experience}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Specialties</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {consultant.specialties.map((specialty) => (
            <span
              key={specialty}
              className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-600"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-slate-600">
        <p className="break-all">
          <span className="font-semibold text-slate-700">Email: </span>
          {consultant.email}
        </p>
        <p className="break-all">
          <span className="font-semibold text-slate-700">Phone: </span>
          {consultant.phone}
        </p>
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
        {consultant.bio}
      </p>
    </article>
  );
}

const REVIEWS = [
  {
    id: 'review-1',
    consultantName: 'Dr. Saman Rathnayaka',
    studentName: 'Alex Johnson',
    sessionId: 'SES-001-2024',
    review: 'Very helpful session. Great advice on managing anxiety.',
    status: 'pending',
  },
  {
    id: 'review-2',
    consultantName: 'Ms. Nethmi Kuruppuge',
    studentName: 'Emma Wilson',
    sessionId: 'SES-002-2024',
    review: 'Excellent guidance on career planning and stress management.',
    status: 'pending',
  },
  {
    id: 'review-3',
    consultantName: 'Mr. Ravindu Peris',
    studentName: 'Michael Chen',
    sessionId: 'SES-003-2024',
    review: 'Very professional and supportive consultant.',
    status: 'pending',
  },
  {
    id: 'review-4',
    consultantName: 'Dr. Saman Rathnayaka',
    studentName: 'Sarah Davis',
    sessionId: 'SES-004-2024',
    review: 'Helped me understand my exam anxiety better.',
    status: 'pending',
  },
];

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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Session ID</p>
              <p className="mt-1 text-sm text-slate-900">{review.sessionId}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full Review</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{review.review}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                    review.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : review.status === 'disapproved'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {review.status === 'approved' ? '✓ Approved' : review.status === 'disapproved' ? '✕ Disapproved' : '◯ Pending'}
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
  const [reviews, setReviews] = React.useState(REVIEWS);
  const [selectedReview, setSelectedReview] = React.useState(null);

  const handleApprove = (id) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
  };

  const handleDisapprove = (id) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'disapproved' } : r))
    );
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Available Consultants</h1>

      <section aria-label="Available consultants" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CONSULTANTS.map((consultant, index) => (
          <ConsultantCard key={consultant.id} consultant={consultant} index={index} />
        ))}
      </section>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Review & Approve</h2>

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
                  Session ID
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
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-sm text-slate-900 font-medium">{review.consultantName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{review.studentName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{review.sessionId}</td>
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
                            onClick={() => handleApprove(review.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleDisapprove(review.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-100 hover:bg-red-100 transition"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Disapprove
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
                          {review.status === 'approved' ? '✓ Approved' : '✕ Disapproved'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />
    </div>
  );
}