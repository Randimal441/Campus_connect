import { useEffect, useMemo, useState } from 'react';
import {
  applyForParticipation,
  getMyEventApplications,
  getUpcomingEvents,
} from '../../services/eventsService';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
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

const getCountdownData = (eventDate, now) => {
  const diff = new Date(eventDate).getTime() - now.getTime();

  if (diff <= -2 * 60 * 60 * 1000) {
    return {
      status: 'ended',
      label: 'Event Ended',
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  if (diff <= 0) {
    return {
      status: 'started',
      label: 'Event Started',
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return {
    status: 'upcoming',
    label: `Event starts in ${days} days ${hours} hours ${minutes} minutes`,
    days,
    hours,
    minutes,
  };
};

const getApplicationKey = (eventId, option) => `${eventId}:${option}`;

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
    label: '',
    className: '',
  };
};

export default function EventsChill() {
  const { user } = useAuth();
  const normalizedUserRole = String(user?.role || '').trim().toLowerCase();
  const isStudent = normalizedUserRole === ROLES.STUDENT;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applyingKey, setApplyingKey] = useState('');
  const [applicationStatusMap, setApplicationStatusMap] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [applicationAnswersByOption, setApplicationAnswersByOption] = useState({});

  const optionLabelMap = useMemo(
    () =>
      PARTICIPATION_OPTIONS.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    []
  );

  useEffect(() => {
    let isCancelled = false;

    const loadEventData = async () => {
      setLoading(true);
      try {
        const [events, myApplications] = await Promise.all([
          getUpcomingEvents(),
          isStudent ? getMyEventApplications() : Promise.resolve([]),
        ]);

        if (isCancelled) return;

        const statusMap = {};
        myApplications.forEach((entry) => {
          statusMap[getApplicationKey(entry.eventId, entry.option)] = entry.status;
        });

        setItems(events);
        setApplicationStatusMap(statusMap);
        setError('');
      } catch (err) {
        if (isCancelled) return;
        setItems([]);
        setApplicationStatusMap({});
        setError(err.message || 'Unable to load upcoming events right now.');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadEventData();

    return () => {
      isCancelled = true;
    };
  }, [isStudent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isStudent) return undefined;

    let isCancelled = false;
    const refreshStatuses = async () => {
      try {
        const myApplications = await getMyEventApplications();
        if (isCancelled) return;

        const statusMap = {};
        myApplications.forEach((entry) => {
          statusMap[getApplicationKey(entry.eventId, entry.option)] = entry.status;
        });

        setApplicationStatusMap(statusMap);
      } catch {
        // Keep the last known status map if polling fails.
      }
    };

    const intervalId = setInterval(refreshStatuses, 15000);
    refreshStatuses();

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [isStudent]);

  const upcomingItems = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return [...items]
      .filter((item) => new Date(item.date).getTime() >= todayStart.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items]);

  const formatOptionLabel = (option) => optionLabelMap[option] || option;

  const getParticipationTemplate = (eventItem, option) => {
    const forms = Array.isArray(eventItem?.participationForms)
      ? eventItem.participationForms
      : [];

    const matched = forms.find((form) => form.option === option);
    return Array.isArray(matched?.questions) ? matched.questions : [];
  };

  const createInitialAnswersForOption = (eventItem, option) => {
    const templateQuestions = getParticipationTemplate(eventItem, option);

    if (templateQuestions.length > 0) {
      return templateQuestions.reduce((acc, question) => {
        acc[question.key] = '';
        return acc;
      }, {});
    }

    return {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: '',
      notes: '',
    };
  };

  const getStudentApplicationStatus = (eventItem, option) => {
    if (!user?._id) return '';

    const statusFromMap = applicationStatusMap[getApplicationKey(eventItem._id, option)];
    if (statusFromMap) return statusFromMap;

    const applications = Array.isArray(eventItem.participationApplications)
      ? eventItem.participationApplications
      : [];

    const matched = applications.find((entry) => {
      const studentId = typeof entry.student === 'object' ? entry.student?._id : entry.student;
      return String(studentId) === String(user._id) && entry.option === option;
    });

    return matched?.status || '';
  };

  const openEventDetails = (eventItem) => {
    setSelectedEvent(eventItem);
    setSelectedOptions([]);
    setApplicationAnswersByOption({});
    setApplyError('');
    setApplyMessage('');
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
    setSelectedOptions([]);
    setApplicationAnswersByOption({});
    setApplyingKey('');
  };

  const toggleApplicationOption = (option) => {
    if (!selectedEvent) return;

    setSelectedOptions((prev) => {
      const exists = prev.includes(option);
      if (exists) {
        setApplicationAnswersByOption((answersPrev) => {
          const next = { ...answersPrev };
          delete next[option];
          return next;
        });
        return prev.filter((value) => value !== option);
      }

      setApplicationAnswersByOption((answersPrev) => ({
        ...answersPrev,
        [option]: createInitialAnswersForOption(selectedEvent, option),
      }));

      return [...prev, option];
    });

    setApplyError('');
    setApplyMessage('');
  };

  const handleApplicationFieldChange = (option, fieldKey, value) => {
    setApplicationAnswersByOption((prev) => ({
      ...prev,
      [option]: {
        ...(prev[option] || {}),
        [fieldKey]: value,
      },
    }));
  };

  const handleApplySelected = async (eventId) => {
    if (!selectedEvent || selectedOptions.length === 0) {
      setApplyError('Please select at least one participation option.');
      return;
    }

    setApplyingKey(eventId);
    setApplyMessage('');
    setApplyError('');

    try {
      const validatedSubmissions = selectedOptions.map((option) => {
        const optionAnswers = applicationAnswersByOption[option] || {};
        const templateQuestions = getParticipationTemplate(selectedEvent, option);
        const hasTemplate = templateQuestions.length > 0;

        if (hasTemplate) {
          const missingRequired = templateQuestions.some(
            (question) => question.required && !String(optionAnswers[question.key] || '').trim()
          );

          if (missingRequired) {
            throw new Error(`Please complete all required questions for ${formatOptionLabel(option)}.`);
          }
        } else {
          const fullName = String(optionAnswers.fullName || '').trim();
          const email = String(optionAnswers.email || '').trim();
          const phone = String(optionAnswers.phone || '').trim();
          const notes = String(optionAnswers.notes || '').trim();

          if (!fullName || !email || !phone || !notes) {
            throw new Error(`Please complete the application form for ${formatOptionLabel(option)}.`);
          }
        }

        const answers = hasTemplate
          ? templateQuestions.map((question) => ({
              questionKey: question.key,
              label: question.label,
              answer: String(optionAnswers[question.key] || '').trim(),
            }))
          : [];

        return {
          option,
          application: {
            fullName: optionAnswers.fullName || '',
            email: optionAnswers.email || '',
            phone: optionAnswers.phone || '',
            notes: optionAnswers.notes || '',
            answers,
          },
        };
      });

      for (const submission of validatedSubmissions) {
        await applyForParticipation(eventId, {
          option: submission.option,
          application: submission.application,
        });
      }

      const appliedKeys = validatedSubmissions.map((submission) =>
        getApplicationKey(eventId, submission.option)
      );
      setApplicationStatusMap((prev) => {
        const next = { ...prev };
        appliedKeys.forEach((key) => {
          next[key] = 'pending';
        });
        return next;
      });

      setApplyMessage(
        `Application submitted for ${validatedSubmissions.length} participation option${validatedSubmissions.length > 1 ? 's' : ''}.`
      );

      const newApplications = validatedSubmissions.map((submission) => ({
        student: user?._id,
        option: submission.option,
        application: submission.application,
        appliedAt: new Date().toISOString(),
        status: 'pending',
      }));

      setItems((prev) =>
        prev.map((eventItem) => {
          if (eventItem._id !== eventId) return eventItem;
          const existingApps = Array.isArray(eventItem.participationApplications)
            ? eventItem.participationApplications
            : [];

          return {
            ...eventItem,
            participationApplications: [...existingApps, ...newApplications],
          };
        })
      );

      setSelectedEvent((prev) => {
        if (!prev || prev._id !== eventId) return prev;
        const existingApps = Array.isArray(prev.participationApplications)
          ? prev.participationApplications
          : [];

        return {
          ...prev,
          participationApplications: [...existingApps, ...newApplications],
        };
      });

      setSelectedOptions([]);
      setApplicationAnswersByOption({});
    } catch (err) {
      setApplyError(err.message || 'Unable to submit application right now.');
    } finally {
      setApplyingKey('');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 rounded-2xl bg-gradient-to-br from-green-50 to-white p-8 md:p-12 border border-green-100 animate-fade-in-up">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                Discover and Join<br />
                <span className="text-green-600">Campus Events</span>
              </h1>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Experience the vibrant campus life! Browse and participate in exciting events, 
                workshops, competitions, and social gatherings. Connect with fellow students, 
                develop new skills, and create lasting memories. Find the perfect event that 
                matches your interests and join our growing community today.
              </p>
              <button
                onClick={() => document.getElementById('events-grid').scrollIntoView({ behavior: 'smooth' })}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Explore Events
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px] max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading upcoming events...</p>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-6xl mx-auto text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-xl font-semibold text-gray-800 mb-2">Unable to load events</p>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : upcomingItems.length === 0 ? (
          <div className="max-w-6xl mx-auto text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 p-8">
            <div className="text-6xl mb-4">🎪</div>
            <p className="text-xl font-semibold text-gray-800 mb-2">No upcoming events available</p>
            <p className="text-gray-600">Stay tuned for the next campus event!</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {applyMessage ? <p className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{applyMessage}</p> : null}
            {applyError ? <p className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{applyError}</p> : null}

            <div id="events-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingItems.map((item, index) => {
              const countdown = getCountdownData(item.date, now);

              return (
                <div
                  key={item._id}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Card Image */}
                  <div className="w-full h-48 bg-gray-100 overflow-hidden rounded-t-2xl">
                    {resolveImageUrl(item.image) ? (
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Event Type Badge */}
                    <div className="inline-block mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        {(item.eventType || 'event').replace('_', ' ')}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 text-sinhala">{item.title}</h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 text-sinhala">
                      {item.description || 'No description provided for this event.'}
                    </p>

                    {/* Countdown & Date */}
                    <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <p className="text-xs font-semibold text-green-600 mb-2">{countdown.label}</p>
                      {countdown.status === 'upcoming' ? (
                        <div className="flex gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-700">{countdown.days}</div>
                            <div className="text-xs text-green-600">Days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-700">{countdown.hours}</div>
                            <div className="text-xs text-green-600">Hours</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-700">{countdown.minutes}</div>
                            <div className="text-xs text-green-600">Minutes</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-green-700">{countdown.label}</div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                      <span className="font-semibold text-gray-700">📅 </span>
                      {new Date(item.date).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>

                    {/* Status Badges */}
                    {isStudent ? (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {(item.participationOptions || []).map((option) => {
                          const status = getStudentApplicationStatus(item, option);
                          if (!status) return null;

                          const statusMeta = getStatusMeta(status);
                          return (
                            <button
                              key={`${item._id}-${option}-status`}
                              type="button"
                              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-default ${statusMeta.className}`}
                              disabled
                            >
                              {formatOptionLabel(option)}: {statusMeta.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {/* View More Button */}
                    <button
                      type="button"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300"
                      onClick={() => openEventDetails(item)}
                    >
                      View More
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {selectedEvent ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto" onClick={closeEventDetails}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl my-8 animate-scale-in" onClick={(event) => event.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-0">
                  {selectedOptions.length > 0 ? 'Application Form' : 'Event Details'}
                </h3>
                <button 
                  type="button" 
                  className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
                  onClick={closeEventDetails}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(100vh-200px)]">

                {selectedOptions.length > 0 ? (
                <form
                  className="p-6 space-y-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleApplySelected(selectedEvent._id);
                  }}
                >
                  <p className="text-gray-600">
                    Fill and submit all selected participation applications for <strong className="text-gray-800">{selectedEvent.title}</strong>.
                  </p>

                  {/* Participation Options */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Select Participation Options</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.participationOptions.map((option) => {
                        const status = getStudentApplicationStatus(selectedEvent, option);
                        const applied = !!status;
                        const selected = selectedOptions.includes(option);
                        const statusMeta = getStatusMeta(status);

                        return (
                          <button
                            key={`selected-${option}`}
                            type="button"
                            className={
                              applied
                                ? `px-4 py-2 rounded-full text-sm font-semibold cursor-default ${statusMeta.className}`
                                : `px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 ${selected ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:border-green-500'}`
                            }
                            onClick={() => toggleApplicationOption(option)}
                            disabled={applied}
                          >
                            {formatOptionLabel(option)}{' '}
                            {applied
                              ? `(${statusMeta.label})`
                              : selected
                                ? '✓'
                                : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Fields for Selected Options */}
                  {selectedOptions.map((option) => {
                    const templateQuestions = getParticipationTemplate(selectedEvent, option);
                    const optionAnswers = applicationAnswersByOption[option] || {};

                    return (
                      <div key={option} className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">{formatOptionLabel(option)} Details</h4>

                        {templateQuestions.length > 0 ? (
                          <div className="space-y-4">
                            {templateQuestions.map((question) => (
                              <div key={`${option}-${question.key}`}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {question.label}
                                  {question.required ? <span className="text-red-500 ml-1">*</span> : ''}
                                </label>
                                <textarea
                                  rows={3}
                                  value={optionAnswers[question.key] || ''}
                                  onChange={(event) =>
                                    handleApplicationFieldChange(option, question.key, event.target.value)
                                  }
                                  required={question.required !== false}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Full Name
                                  <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={optionAnswers.fullName || ''}
                                  onChange={(event) =>
                                    handleApplicationFieldChange(option, 'fullName', event.target.value)
                                  }
                                  required
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Email
                                  <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                  type="email"
                                  value={optionAnswers.email || ''}
                                  onChange={(event) =>
                                    handleApplicationFieldChange(option, 'email', event.target.value)
                                  }
                                  required
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Phone Number
                                  <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={optionAnswers.phone || ''}
                                  onChange={(event) =>
                                    handleApplicationFieldChange(option, 'phone', event.target.value)
                                  }
                                  placeholder="07X XXX XXXX"
                                  required
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Why are you applying for this role?
                                <span className="text-red-500 ml-1">*</span>
                              </label>
                              <textarea
                                rows={4}
                                value={optionAnswers.notes || ''}
                                onChange={(event) =>
                                  handleApplicationFieldChange(option, 'notes', event.target.value)
                                }
                                placeholder="Share your relevant skills, interest, or experience."
                                required
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      className="flex-1 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-300"
                      onClick={() => {
                        setSelectedOptions([]);
                        setApplicationAnswersByOption({});
                      }}
                    >
                      Back to Details
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={applyingKey === selectedEvent._id}
                    >
                      {applyingKey === selectedEvent._id
                        ? 'Submitting...'
                        : `Submit ${selectedOptions.length} Application${selectedOptions.length > 1 ? 's' : ''}`}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Event Image */}
                  {resolveImageUrl(selectedEvent.image) ? (
                    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={resolveImageUrl(selectedEvent.image)}
                        alt={selectedEvent.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}

                  {/* Event Title */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 text-sinhala">{selectedEvent.title}</h3>
                  </div>

                  {/* Event Description */}
                  <div>
                    <p className="text-gray-600 text-sinhala leading-relaxed">
                      {selectedEvent.description || 'No description provided for this event.'}
                    </p>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Date</span>
                      <p className="text-gray-700 font-medium">
                        {new Date(selectedEvent.date).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Time</span>
                      <p className="text-gray-700 font-medium">
                        {new Date(selectedEvent.date).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Location</span>
                      <p className="text-gray-700 font-medium text-sinhala">{selectedEvent.location || 'TBA'}</p>
                    </div>
                  </div>

                  {/* Participation Options */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Participation Opportunities</h4>

                    {!isStudent ? (
                      <p className="text-gray-500 text-sm bg-blue-50 border border-blue-100 rounded-lg p-3">
                        Participation applications can be submitted by student accounts only.
                      </p>
                    ) : null}

                    {Array.isArray(selectedEvent.participationOptions) && selectedEvent.participationOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.participationOptions.map((option) => {
                          const status = getStudentApplicationStatus(selectedEvent, option);
                          const applied = !!status;
                          const selected = selectedOptions.includes(option);
                          const statusMeta = getStatusMeta(status);

                          return (
                            <button
                              key={option}
                              type="button"
                              className={
                                applied
                                  ? `px-4 py-2 rounded-full text-sm font-semibold cursor-default ${statusMeta.className}`
                                  : `px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 ${selected ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:border-green-500'}`
                              }
                              onClick={() => toggleApplicationOption(option)}
                              disabled={applied}
                            >
                              {formatOptionLabel(option)}{' '}
                              {applied
                                ? `(${statusMeta.label})`
                                : selected
                                  ? '✓'
                                  : ''}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No participation roles are open for this event.</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isStudent && selectedEvent.participationOptions && selectedEvent.participationOptions.length > 0 && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        className="flex-1 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-300"
                        onClick={closeEventDetails}
                      >
                        Close
                      </button>
                      {selectedOptions.length > 0 && (
                        <button
                          type="button"
                          className="flex-1 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300"
                          onClick={() => {
                            // Form section will now show
                          }}
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
