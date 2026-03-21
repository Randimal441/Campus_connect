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
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="mb-8 animate-fade-in-up">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-primary-light p-6 md:p-8 shadow-lg border border-white/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">🎉</div>
              <h1 className="!mb-0 !text-white">Event Dashboard</h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loader mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading upcoming events...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-muted rounded-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">Unable to load events</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : upcomingItems.length === 0 ? (
          <div className="text-center py-16 bg-muted rounded-2xl">
            <div className="text-6xl mb-4">🎪</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">No upcoming events available</p>
            <p className="text-muted-foreground">Stay tuned for the next campus event!</p>
          </div>
        ) : (
          <div>
            {applyMessage ? <p className="event-apply-success">{applyMessage}</p> : null}
            {applyError ? <p className="event-apply-error">{applyError}</p> : null}

            <div className="event-dashboard-grid">
            {upcomingItems.map((item, index) => {
              const countdown = getCountdownData(item.date, now);

              return (
                <div
                  key={item._id}
                  className="event-card animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="event-card-image-wrap">
                    {resolveImageUrl(item.image) ? (
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.title}
                        className="event-card-image"
                      />
                    ) : (
                      <div className="event-card-image-placeholder">No Image</div>
                    )}
                  </div>

                  <div className="event-card-header">
                    <span className="event-card-type capitalize">{(item.eventType || 'event').replace('_', ' ')}</span>
                    <h3 className="event-card-title text-sinhala">{item.title}</h3>
                  </div>

                  <p className="event-card-description text-sinhala">
                    {item.description || 'No description provided for this event.'}
                  </p>

                  <div className="event-card-meta-list">
                    <div className="event-card-meta-item">
                      <span className="event-card-meta-label">Date</span>
                      <span className="event-card-meta-value">
                        {new Date(item.date).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="event-countdown-wrap">
                    <p className="event-countdown-label mb-2">{countdown.label}</p>
                    {countdown.status === 'upcoming' ? (
                      <div className="event-countdown-chips">
                        <div className="countdown-chip">
                          <span className="countdown-chip-value">{countdown.days}</span>
                          <span className="countdown-chip-unit">Days</span>
                        </div>
                        <div className="countdown-chip">
                          <span className="countdown-chip-value">{countdown.hours}</span>
                          <span className="countdown-chip-unit">Hours</span>
                        </div>
                        <div className="countdown-chip">
                          <span className="countdown-chip-value">{countdown.minutes}</span>
                          <span className="countdown-chip-unit">Minutes</span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="event-card-actions">
                    <button
                      type="button"
                      className="event-view-more-btn"
                      onClick={() => openEventDetails(item)}
                    >
                      View More
                    </button>
                  </div>

                  {isStudent ? (
                    <div className="mt-3 flex flex-wrap gap-2">
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
                </div>
              );
            })}
            </div>
          </div>
        )}

        {selectedEvent ? (
          <div className="event-modal-backdrop" onClick={closeEventDetails}>
            <div className="event-modal" onClick={(event) => event.stopPropagation()}>
              <div className="event-modal-header">
                <h3 className="mb-0">{selectedOptions.length > 0 ? 'Participation Application Forms' : 'Event Details'}</h3>
                <button type="button" className="event-modal-close-btn" onClick={closeEventDetails}>X</button>
              </div>

              {selectedOptions.length > 0 ? (
                <form
                  className="event-application-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleApplySelected(selectedEvent._id);
                  }}
                >
                  <p className="event-application-subtitle">
                    Fill and submit all selected participation applications for <strong>{selectedEvent.title}</strong>.
                  </p>

                  <div className="event-modal-participation-wrap">
                    <p className="event-participation-title mb-2">Available Participation Options (Click to select)</p>
                    <div className="event-option-list">
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
                                ? `px-3 py-2 rounded-full text-sm font-semibold cursor-default ${statusMeta.className}`
                                : `event-option-btn ${selected ? 'selected' : ''}`
                            }
                            onClick={() => toggleApplicationOption(option)}
                            disabled={applied}
                          >
                            {formatOptionLabel(option)}{' '}
                            {applied
                              ? `(${statusMeta.label})`
                              : selected
                                ? '(Selected)'
                                : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedOptions.map((option) => {
                    const templateQuestions = getParticipationTemplate(selectedEvent, option);
                    const optionAnswers = applicationAnswersByOption[option] || {};

                    return (
                      <div key={option} className="event-selected-option-section">
                        <h4 className="event-selected-option-title mb-1">{formatOptionLabel(option)}</h4>

                        {templateQuestions.length > 0 ? (
                          <div className="event-application-grid">
                            {templateQuestions.map((question) => (
                              <label key={`${option}-${question.key}`} className="event-application-field">
                                <span>
                                  {question.label}
                                  {question.required ? ' *' : ''}
                                </span>
                                <textarea
                                  rows={3}
                                  value={optionAnswers[question.key] || ''}
                                  onChange={(event) =>
                                    handleApplicationFieldChange(option, question.key, event.target.value)
                                  }
                                  required={question.required !== false}
                                />
                              </label>
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="event-application-grid">
                              <label className="event-application-field">
                                <span>Full Name</span>
                                <input
                                  type="text"
                                  value={optionAnswers.fullName || ''}
                                  onChange={(event) =>
                                    handleApplicationFieldChange(option, 'fullName', event.target.value)
                                  }
                                  required
                                />
                              </label>

                              <label className="event-application-field">
                                <span>Email</span>
                                <input
                                  type="email"
                                  value={optionAnswers.email || ''}
                                  onChange={(event) =>
                                    handleApplicationFieldChange(option, 'email', event.target.value)
                                  }
                                  required
                                />
                              </label>

                              <label className="event-application-field">
                                <span>Phone Number</span>
                                <input
                                  type="text"
                                  value={optionAnswers.phone || ''}
                                  onChange={(event) =>
                                    handleApplicationFieldChange(option, 'phone', event.target.value)
                                  }
                                  placeholder="07X XXX XXXX"
                                  required
                                />
                              </label>
                            </div>

                            <label className="event-application-field">
                              <span>Why are you applying for this role?</span>
                              <textarea
                                rows={4}
                                value={optionAnswers.notes || ''}
                                onChange={(event) =>
                                  handleApplicationFieldChange(option, 'notes', event.target.value)
                                }
                                placeholder="Share your relevant skills, interest, or experience."
                                required
                              />
                            </label>
                          </>
                        )}
                      </div>
                    );
                  })}

                  <div className="event-application-actions">
                    <button
                      type="button"
                      className="event-secondary-btn"
                      onClick={() => {
                        setSelectedOptions([]);
                        setApplicationAnswersByOption({});
                      }}
                    >
                      Back to Details
                    </button>
                    <button
                      type="submit"
                      className="event-primary-btn"
                      disabled={applyingKey === selectedEvent._id}
                    >
                      {applyingKey === selectedEvent._id
                        ? 'Submitting...'
                        : `Submit ${selectedOptions.length} Application${selectedOptions.length > 1 ? 's' : ''}`}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="event-modal-content">
                  {resolveImageUrl(selectedEvent.image) ? (
                    <img
                      src={resolveImageUrl(selectedEvent.image)}
                      alt={selectedEvent.title}
                      className="event-modal-image"
                    />
                  ) : null}

                  <h3 className="event-modal-title text-sinhala">{selectedEvent.title}</h3>
                  <p className="event-modal-description text-sinhala">
                    {selectedEvent.description || 'No description provided for this event.'}
                  </p>

                  <div className="event-card-meta-list">
                    <div className="event-card-meta-item">
                      <span className="event-card-meta-label">Date</span>
                      <span className="event-card-meta-value">
                        {new Date(selectedEvent.date).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="event-card-meta-item">
                      <span className="event-card-meta-label">Time</span>
                      <span className="event-card-meta-value">
                        {new Date(selectedEvent.date).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="event-card-meta-item">
                      <span className="event-card-meta-label">Location</span>
                      <span className="event-card-meta-value text-sinhala">{selectedEvent.location || 'TBA'}</span>
                    </div>
                  </div>

                  <div className="event-modal-participation-wrap">
                    <p className="event-participation-title mb-2">Available Participation Options</p>

                    {!isStudent ? (
                      <p className="event-participation-empty mb-2">
                        Participation applications can be submitted by student accounts only.
                      </p>
                    ) : null}

                    {Array.isArray(selectedEvent.participationOptions) && selectedEvent.participationOptions.length > 0 ? (
                      <div className="event-option-list">
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
                                  ? `px-3 py-2 rounded-full text-sm font-semibold cursor-default ${statusMeta.className}`
                                  : `event-option-btn ${selected ? 'selected' : ''}`
                              }
                              onClick={() => toggleApplicationOption(option)}
                              disabled={applied}
                            >
                              {formatOptionLabel(option)}{' '}
                              {applied
                                ? `(${statusMeta.label})`
                                : selected
                                  ? '(Selected)'
                                  : ''}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="event-participation-empty mb-0">No participation roles are open for this event.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
