import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import {
  applyForParticipation,
  getMyEventApplications,
  getUpcomingEvents,
  removeParticipationApplication,
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
const askPhoneRegex = /^0\d{9}$/;
const emailHasAtRegex = /^[^\s@]+@[^\s@]+$/;
const studentIdRegex = /^.{10}$/;

const FALLBACK_FIELDS = ['fullName', 'email', 'phone', 'studentId'];

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
  const [deleting, setDeleting] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const modalInputBaseClass =
    'w-full h-11 px-3 py-2 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2';
  const modalTextareaBaseClass =
    'w-full min-h-[112px] px-3 py-2 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 resize-y';

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
    const questions = Array.isArray(matched?.questions) ? matched.questions : [];
    return questions.filter(
      (question) => String(question?.key || '').toLowerCase() !== 'participation_options'
    );
  };

  const createInitialAnswers = (option) => {
    const savedApplication = eventApplicationsByOption[option]?.application;
    const templateQuestions = getParticipationTemplate(option);

    if (templateQuestions.length > 0) {
      const answersMap = new Map(
        (savedApplication?.answers || []).map((entry) => [entry.questionKey, entry.answer])
      );

      return templateQuestions.reduce((acc, question) => {
        const keyText = String(question?.key || '').toLowerCase();
        const savedAnswer = answersMap.get(question.key);

        if (keyText === 'full_name') {
          acc[question.key] = String(savedAnswer || user?.fullName || '');
          return acc;
        }

        if (keyText === 'email') {
          acc[question.key] = String(savedAnswer || user?.email || '');
          return acc;
        }

        acc[question.key] = String(savedAnswer || '');
        return acc;
      }, {});
    }

    return {
      fullName: savedApplication?.fullName || user?.fullName || '',
      studentId: savedApplication?.studentId || '',
      email: savedApplication?.email || user?.email || '',
      phone: savedApplication?.phone || '',
    };
  };

  const createBlankAnswers = (option) => {
    const templateQuestions = getParticipationTemplate(option);

    if (templateQuestions.length > 0) {
      return templateQuestions.reduce((acc, question) => {
        acc[question.key] = '';
        return acc;
      }, {});
    }

    return {
      fullName: '',
      studentId: '',
      email: '',
      phone: '',
    };
  };

  const validateField = (option, fieldKey, value) => {
    const trimmed = String(value || '').trim();
    const templateQuestions = getParticipationTemplate(option);

    if (templateQuestions.length > 0) {
      const question = templateQuestions.find((entry) => entry.key === fieldKey);
      const keyText = String(question?.key || '').toLowerCase();
      const labelText = String(question?.label || '').toLowerCase();
      const isEmailQuestion = keyText.includes('email') || labelText.includes('email');
      const isPhoneQuestion = keyText.includes('phone') || labelText.includes('phone');
      const isStudentIdQuestion = keyText.includes('studentid')
        || keyText.includes('student_id')
        || (labelText.includes('student') && labelText.includes('id'));

      if (question?.required && !trimmed) {
        return `${question.label} is required.`;
      }

      if (isEmailQuestion && trimmed && !emailHasAtRegex.test(trimmed)) {
        return 'Email must include @.';
      }

      if (isPhoneQuestion && trimmed && !askPhoneRegex.test(trimmed)) {
        return 'Phone number must start with 0 and contain exactly 10 digits.';
      }

      if (isStudentIdQuestion && trimmed && !studentIdRegex.test(trimmed)) {
        return 'Student ID must contain exactly 10 characters.';
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

    if (fieldKey === 'studentId') {
      if (!trimmed) return 'Student ID is required.';
      if (!studentIdRegex.test(trimmed)) return 'Student ID must contain exactly 10 characters.';
      return '';
    }

    if (fieldKey === 'phone') {
      if (!trimmed) return 'Phone number is required.';
      if (!askPhoneRegex.test(trimmed)) return 'Phone number must start with 0 and contain exactly 10 digits.';
      return '';
    }

    return '';
  };

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    setIsApplicationModalOpen(true);
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
      FALLBACK_FIELDS.forEach((fieldKey) => {
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

    const normalizedFullName = String(answers.full_name || answers.fullName || '').trim();
    const normalizedStudentId = String(answers.student_id || answers.studentId || '').trim();
    const normalizedEmail = String(answers.email || '').trim();
    const normalizedPhone = String(answers.phone || '').trim();

    const payload = {
      fullName: normalizedFullName,
      studentId: normalizedStudentId,
      email: normalizedEmail,
      phone: normalizedPhone,
      notes: 'N/A',
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

  const handleClearApplicationForm = () => {
    if (!selectedOption) return;
    setAnswers(createBlankAnswers(selectedOption));
    setFieldErrors({});
    setFieldTouched({});
    setSubmitAttempted(false);
    setApplyError('');
    setApplyMessage('');
  };

  const handleDeleteApplication = async () => {
    if (!selectedEvent || !selectedOption) return;

    const currentApplication = eventApplicationsByOption[selectedOption];
    const status = String(currentApplication?.status || '').toLowerCase();

    if (!currentApplication?.id || status !== 'pending') {
      setApplyError('Only pending applications can be deleted.');
      return;
    }

    setDeleting(true);
    setApplyError('');
    setApplyMessage('');

    try {
      await removeParticipationApplication(selectedEvent._id, currentApplication.id);

      setMyApplications((prev) => prev.filter(
        (entry) => !(String(entry.eventId) === String(selectedEvent._id) && entry.option === selectedOption)
      ));

      setAnswers(createBlankAnswers(selectedOption));
      setFieldErrors({});
      setFieldTouched({});
      setSubmitAttempted(false);
      setApplyMessage('Pending application deleted successfully.');
    } catch (err) {
      setApplyError(err.message || 'Unable to delete application right now.');
    } finally {
      setDeleting(false);
    }
  };

  const getFieldClassName = (fieldKey, isTextarea = false) => {
    const hasError = (submitAttempted || fieldTouched[fieldKey]) && Boolean(fieldErrors[fieldKey]);
    const baseClass = isTextarea ? modalTextareaBaseClass : modalInputBaseClass;

    return `${baseClass} ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
    }`;
  };

  const isApplicationFormValid = (() => {
    if (!selectedOption || !selectedEvent) return false;

    const templateQuestions = getParticipationTemplate(selectedOption);
    if (templateQuestions.length > 0) {
      return templateQuestions.every(
        (question) => !validateField(selectedOption, question.key, answers[question.key])
      );
    }

    return FALLBACK_FIELDS.every(
      (fieldKey) => !validateField(selectedOption, fieldKey, answers[fieldKey])
    );
  })();

  const selectedApplication = selectedOption ? eventApplicationsByOption[selectedOption] : null;
  const selectedApplicationStatus = String(selectedApplication?.status || '').toLowerCase();
  const canManagePendingApplication = selectedApplicationStatus === 'pending' && !!selectedApplication?.id;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <section className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => navigate('/user/events')}
            >
              Back to Events
            </button>
            <Link
              to="/user/events"
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

                      <p className="text-sm text-gray-600">
                        Select a participation option to open the application form popup.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </article>
          )}

          {isStudent && selectedOption && isApplicationModalOpen && selectedEvent ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setIsApplicationModalOpen(false)}
            >
              <div
                className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-gray-100 bg-green-50 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">Participation Application</p>
                    <h3 className="text-lg font-bold text-gray-800">
                      {optionLabelMap[selectedOption] || selectedOption}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsApplicationModalOpen(false)}
                    className="w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    aria-label="Close participation application form"
                  >
                    x
                  </button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
                  <form className="space-y-4" onSubmit={handleSubmitApplication} noValidate>
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

                    {selectedApplication && selectedApplicationStatus !== 'pending' ? (
                      <p className="p-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm">
                        This application is already {selectedApplicationStatus} and can no longer be changed.
                      </p>
                    ) : null}

                    {getParticipationTemplate(selectedOption).length > 0 ? (
                      getParticipationTemplate(selectedOption).map((question) => (
                        <div key={question.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {question.label}
                            {question.required ? <span className="text-red-500 ml-1">*</span> : ''}
                          </label>
                          <input
                            type={String(question?.key || '').toLowerCase() === 'email' ? 'email' : 'text'}
                            value={answers[question.key] || ''}
                            onChange={(event) => handleAnswerChange(question.key, event.target.value)}
                            onBlur={(event) => handleFieldBlur(question.key, event.target.value)}
                            className={getFieldClassName(question.key)}
                            inputMode={String(question?.key || '').toLowerCase() === 'phone' ? 'numeric' : undefined}
                            maxLength={String(question?.key || '').toLowerCase() === 'student_id' ? 10 : undefined}
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
                            className={getFieldClassName('fullName')}
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
                            className={getFieldClassName('email')}
                            required
                          />
                          {(submitAttempted || fieldTouched.email) && fieldErrors.email ? (
                            <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                          ) : null}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                          <input
                            type="text"
                            value={answers.studentId || ''}
                            onChange={(event) => handleAnswerChange('studentId', event.target.value)}
                            onBlur={(event) => handleFieldBlur('studentId', event.target.value)}
                            maxLength={10}
                            className={getFieldClassName('studentId')}
                            required
                          />
                          {(submitAttempted || fieldTouched.studentId) && fieldErrors.studentId ? (
                            <p className="text-xs text-red-600 mt-1">{fieldErrors.studentId}</p>
                          ) : null}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                          <input
                            type="text"
                            value={answers.phone || ''}
                            onChange={(event) => handleAnswerChange('phone', event.target.value)}
                            onBlur={(event) => handleFieldBlur('phone', event.target.value)}
                            inputMode="numeric"
                            maxLength={10}
                            className={getFieldClassName('phone')}
                            required
                          />
                          {(submitAttempted || fieldTouched.phone) && fieldErrors.phone ? (
                            <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                          ) : null}
                        </div>
                      </>
                    )}

                    {canManagePendingApplication ? (
                      <div className="flex items-center justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleDeleteApplication}
                          disabled={deleting || submitting}
                          className="px-4 py-2 border border-red-300 bg-red-50 rounded-lg text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deleting ? 'Deleting...' : 'Delete Application'}
                        </button>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleClearApplicationForm}
                        className="px-4 py-2 border border-red-200 rounded-lg text-red-700 hover:bg-red-50"
                      >
                        Clear Form
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || deleting || !isApplicationFormValid || (selectedApplication && !canManagePendingApplication)}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                      >
                        {submitting
                          ? canManagePendingApplication
                            ? 'Updating...'
                            : 'Submitting...'
                          : canManagePendingApplication
                            ? 'Update Application'
                            : 'Submit Application'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}
