import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import {
  applyForParticipation,
  getMyEventApplications,
  getUpcomingEvents,
  updateParticipationApplication,
} from '../../services/eventsService';
import { useAuth } from '../../hooks/useAuth';
import { PARTICIPATION_OPTIONS, ROLES } from '../../utils/constants';

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${BACKEND_ORIGIN}${imagePath}`;
};

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatTime = (eventItem) => {
  if (eventItem?.time) return eventItem.time;
  return new Date(eventItem.date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const askNameRegex = /^[A-Za-z\s]+$/;
const askPhoneRegex = /^\d{10}$/;
const emailHasAtRegex = /^[^\s@]+@[^\s@]+$/;

const getStatusMeta = (status) => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'approved') {
    return {
      label: 'Approved',
      className: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    };
  }

  if (normalized === 'rejected') {
    return {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 border border-red-300',
    };
  }

  if (normalized === 'pending') {
    return {
      label: 'Pending',
      className: 'bg-amber-100 text-amber-800 border border-amber-300',
    };
  }

  return {
    label: 'Not Applied',
    className: 'bg-gray-100 text-gray-700 border border-gray-300',
  };
};

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const normalizedUserRole = String(user?.role || '').trim().toLowerCase();
  const isStudent = normalizedUserRole === ROLES.STUDENT;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myApplications, setMyApplications] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [answers, setAnswers] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');

  const optionLabelMap = useMemo(
    () =>
      PARTICIPATION_OPTIONS.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    []
  );

  useEffect(() => {
    getUpcomingEvents()
      .then((events) => {
        setItems(Array.isArray(events) ? events : []);
        setError('');
      })
      .catch((err) => {
        setItems([]);
        setError(err.message || 'Unable to load event details right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isStudent) return;

    getMyEventApplications()
      .then((rows) => {
        setMyApplications(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        setMyApplications([]);
      });
  }, [isStudent]);

  const selectedEvent = useMemo(
    () => items.find((item) => String(item._id) === String(id)),
    [items, id]
  );

  const eventApplicationsByOption = useMemo(() => {
    const map = {};
    myApplications.forEach((entry) => {
      if (String(entry.eventId) !== String(id)) return;
      map[entry.option] = entry;
    });
    return map;
  }, [myApplications, id]);

  const getParticipationTemplate = (option) => {
    const forms = Array.isArray(selectedEvent?.participationForms)
      ? selectedEvent.participationForms
      : [];

    const matched = forms.find((form) => form.option === option);
    return Array.isArray(matched?.questions) ? matched.questions : [];
  };

  const createInitialAnswers = (option) => {
    const savedApplication = eventApplicationsByOption[option]?.application;
    const templateQuestions = getParticipationTemplate(option);

    if (templateQuestions.length > 0) {
      const answersMap = new Map(
        (savedApplication?.answers || []).map((entry) => [entry.questionKey, entry.answer])
      );

      return templateQuestions.reduce((acc, question) => {
        acc[question.key] = String(answersMap.get(question.key) || '');
        return acc;
      }, {});
    }

    return {
      fullName: savedApplication?.fullName || user?.fullName || '',
      email: savedApplication?.email || user?.email || '',
      phone: savedApplication?.phone || '',
      notes: savedApplication?.notes || '',
    };
  };

  const validateField = (option, fieldKey, value) => {
    const trimmed = String(value || '').trim();
    const templateQuestions = getParticipationTemplate(option);

    if (templateQuestions.length > 0) {
      const question = templateQuestions.find((entry) => entry.key === fieldKey);
      if (question?.required && !trimmed) {
        return `${question.label} is required.`;
      }
      return '';
    }

    if (fieldKey === 'fullName') {
      if (!trimmed) return 'Full name is required.';
      if (!askNameRegex.test(trimmed)) return 'Name must contain only letters.';
      return '';
    }

    if (fieldKey === 'email') {
      if (!trimmed) return 'Email is required.';
      if (!emailHasAtRegex.test(trimmed)) return 'Email must include @.';
      return '';
    }

    if (fieldKey === 'phone') {
      if (!trimmed) return 'Phone number is required.';
      if (!askPhoneRegex.test(trimmed)) return 'Phone number must contain exactly 10 digits.';
      return '';
    }

    if (fieldKey === 'notes') {
      if (!trimmed) return 'Application note is required.';
      return '';
    }

    return '';
  };

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    setAnswers(createInitialAnswers(option));
    setFieldErrors({});
    setFieldTouched({});
    setSubmitAttempted(false);
    setApplyMessage('');
    setApplyError('');
  };

  const handleAnswerChange = (fieldKey, value) => {
    if (!selectedOption) return;

    setAnswers((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));

    const err = validateField(selectedOption, fieldKey, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[fieldKey] = err;
      else delete next[fieldKey];
      return next;
    });
  };

  const handleFieldBlur = (fieldKey, value) => {
    if (!selectedOption) return;
    const err = validateField(selectedOption, fieldKey, value);

    setFieldTouched((prev) => ({
      ...prev,
      [fieldKey]: true,
    }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[fieldKey] = err;
      else delete next[fieldKey];
      return next;
    });
  };

  const handleSubmitApplication = async (event) => {
    event.preventDefault();

    if (!selectedEvent || !selectedOption) {
      setApplyError('Please select a participation option first.');
      return;
    }

    setSubmitAttempted(true);
    setApplyMessage('');
    setApplyError('');

    const currentApplication = eventApplicationsByOption[selectedOption];
    const status = String(currentApplication?.status || '').toLowerCase();
    if (status && status !== 'pending') {
      setApplyError(`This application is already ${status} and cannot be changed.`);
      return;
    }

    const templateQuestions = getParticipationTemplate(selectedOption);
    const nextErrors = {};

    if (templateQuestions.length > 0) {
      templateQuestions.forEach((question) => {
        const err = validateField(selectedOption, question.key, answers[question.key]);
        if (err) nextErrors[question.key] = err;
      });
    } else {
      ['fullName', 'email', 'phone', 'notes'].forEach((fieldKey) => {
        const err = validateField(selectedOption, fieldKey, answers[fieldKey]);
        if (err) nextErrors[fieldKey] = err;
      });
    }

    setFieldErrors(nextErrors);
    setFieldTouched((prev) => {
      const touched = { ...prev };
      Object.keys(nextErrors).forEach((key) => {
        touched[key] = true;
      });
      return touched;
    });

    if (Object.keys(nextErrors).length > 0) {
      setApplyError('Please fix form validation errors before submitting.');
      return;
    }

    const payload = {
      fullName: answers.fullName || '',
      email: answers.email || '',
      phone: answers.phone || '',
      notes: answers.notes || '',
      answers:
        templateQuestions.length > 0
          ? templateQuestions.map((question) => ({
              questionKey: question.key,
              label: question.label,
              answer: String(answers[question.key] || '').trim(),
            }))
          : [],
    };

    setSubmitting(true);
    try {
      if (currentApplication?.id && status === 'pending') {
        await updateParticipationApplication(selectedEvent._id, currentApplication.id, {
          application: payload,
        });
      } else {
        await applyForParticipation(selectedEvent._id, {
          option: selectedOption,
          application: payload,
        });
      }

      setMyApplications((prev) => {
        const filtered = prev.filter(
          (entry) => !(String(entry.eventId) === String(selectedEvent._id) && entry.option === selectedOption)
        );

        return [
          {
            id: currentApplication?.id || `${selectedEvent._id}:${selectedOption}`,
            eventId: selectedEvent._id,
            option: selectedOption,
            status: 'pending',
            application: payload,
            appliedAt: new Date().toISOString(),
          },
          ...filtered,
        ];
      });

      setApplyMessage('Participation application submitted successfully.');
    } catch (err) {
      setApplyError(err.message || 'Unable to submit application right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <section className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => navigate('/user/events-chill')}
            >
              Back to Events
            </button>
            <Link
              to="/user/events-chill"
              className="text-sm text-green-700 hover:text-green-800 font-semibold"
            >
              View all events
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading event details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 p-8">
              <p className="text-xl font-semibold text-gray-800 mb-2">Unable to load event</p>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : !selectedEvent ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 p-8">
              <p className="text-xl font-semibold text-gray-800 mb-2">Event not found</p>
              <p className="text-gray-600">This event may be unavailable or no longer upcoming.</p>
            </div>
          ) : (
            <article className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {resolveImageUrl(selectedEvent.image) ? (
                <div className="w-full h-64 md:h-80 bg-gray-100">
                  <img
                    src={resolveImageUrl(selectedEvent.image)}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              <div className="p-6 md:p-8 space-y-5">
                <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  {(selectedEvent.eventType || 'event').replace('_', ' ')}
                </span>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{selectedEvent.title}</h1>

                <p className="text-gray-600 leading-relaxed">
                  {selectedEvent.description || 'No description provided for this event.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Date</p>
                    <p className="text-gray-700 font-medium">{formatDate(selectedEvent.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Time</p>
                    <p className="text-gray-700 font-medium">{formatTime(selectedEvent)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                    <p className="text-gray-700 font-medium">{selectedEvent.location || 'TBA'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Participation Applications</h2>

                  {!isStudent ? (
                    <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      Participation applications can be submitted using a student account.
                    </p>
                  ) : !Array.isArray(selectedEvent.participationOptions)
                    || selectedEvent.participationOptions.length === 0 ? (
                    <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      No participation roles are open for this event.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.participationOptions.map((option) => {
                          const applied = eventApplicationsByOption[option];
                          const statusMeta = getStatusMeta(applied?.status);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleSelectOption(option)}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${selectedOption === option ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-700 hover:border-green-500'}`}
                            >
                              {optionLabelMap[option] || option}
                              {applied ? ` (${statusMeta.label})` : ''}
                            </button>
                          );
                        })}
                      </div>

                      {selectedOption ? (
                        <form className="space-y-4 pt-2" onSubmit={handleSubmitApplication}>
                          {applyMessage ? (
                            <p className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                              {applyMessage}
                            </p>
                          ) : null}
                          {applyError ? (
                            <p className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                              {applyError}
                            </p>
                          ) : null}

                          {getParticipationTemplate(selectedOption).length > 0 ? (
                            getParticipationTemplate(selectedOption).map((question) => (
                              <div key={question.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {question.label}
                                  {question.required ? <span className="text-red-500 ml-1">*</span> : ''}
                                </label>
                                <textarea
                                  rows={3}
                                  value={answers[question.key] || ''}
                                  onChange={(event) => handleAnswerChange(question.key, event.target.value)}
                                  onBlur={(event) => handleFieldBlur(question.key, event.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  required={question.required !== false}
                                />
                                {(submitAttempted || fieldTouched[question.key]) && fieldErrors[question.key] ? (
                                  <p className="text-xs text-red-600 mt-1">{fieldErrors[question.key]}</p>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                  type="text"
                                  value={answers.fullName || ''}
                                  onChange={(event) => handleAnswerChange('fullName', event.target.value)}
                                  onBlur={(event) => handleFieldBlur('fullName', event.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  required
                                />
                                {(submitAttempted || fieldTouched.fullName) && fieldErrors.fullName ? (
                                  <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
                                ) : null}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                  type="email"
                                  value={answers.email || ''}
                                  onChange={(event) => handleAnswerChange('email', event.target.value)}
                                  onBlur={(event) => handleFieldBlur('email', event.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  required
                                />
                                {(submitAttempted || fieldTouched.email) && fieldErrors.email ? (
                                  <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                                ) : null}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <input
                                  type="text"
                                  value={answers.phone || ''}
                                  onChange={(event) => handleAnswerChange('phone', event.target.value)}
                                  onBlur={(event) => handleFieldBlur('phone', event.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  required
                                />
                                {(submitAttempted || fieldTouched.phone) && fieldErrors.phone ? (
                                  <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                                ) : null}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Why are you applying? *</label>
                                <textarea
                                  rows={4}
                                  value={answers.notes || ''}
                                  onChange={(event) => handleAnswerChange('notes', event.target.value)}
                                  onBlur={(event) => handleFieldBlur('notes', event.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  required
                                />
                                {(submitAttempted || fieldTouched.notes) && fieldErrors.notes ? (
                                  <p className="text-xs text-red-600 mt-1">{fieldErrors.notes}</p>
                                ) : null}
                              </div>
                            </>
                          )}

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                          >
                            {submitting ? 'Submitting...' : 'Submit Application'}
                          </button>
                        </form>
                      ) : (
                        <p className="text-sm text-gray-600">Select a participation option to fill the form.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </article>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
