import { useEffect, useMemo, useState } from 'react';
import {
  applyForParticipation,
  getMyEventApplications,
  getUpcomingEvents,
  removeParticipationApplication,
  updateParticipationApplication,
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
    label: '',
    className: '',
  };
};

export default function EventsChill() {
  const { user } = useAuth();
  const normalizedUserRole = String(user?.role || '').trim().toLowerCase();
  const isStudent = normalizedUserRole === ROLES.STUDENT;
  
  // Event state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  
  // Application state
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applyingKey, setApplyingKey] = useState('');
  const [appliedMap, setAppliedMap] = useState({});
  
  // Modal & form state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [applicationAnswersByOption, setApplicationAnswersByOption] = useState({});
  const [participationFieldErrors, setParticipationFieldErrors] = useState({});
  const [participationFieldTouched, setParticipationFieldTouched] = useState({});
  const [participationSubmitAttempted, setParticipationSubmitAttempted] = useState(false);
  const [applicationStatusMap, setApplicationStatusMap] = useState({});
  const [applicationMetaMap, setApplicationMetaMap] = useState({});
  
  // Ask panel state
  const [isAskPanelOpen, setIsAskPanelOpen] = useState(false);
  const [askForm, setAskForm] = useState({
    name: '',
    email: '',
    phone: '',
    question: '',
  });
  const [askFormErrors, setAskFormErrors] = useState({});
  const [askFormTouched, setAskFormTouched] = useState({});
  const [askFormMessage, setAskFormMessage] = useState('');
  const [askSubmitAttempted, setAskSubmitAttempted] = useState(false);

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
        setItems(events);
        setError('');
      })
      .catch((err) => {
        setItems([]);
        setError(err.message || 'Unable to load upcoming events right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const upcomingItems = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return [...items]
      .filter((item) => new Date(item.date).getTime() >= todayStart.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items]);

  const formatOptionLabel = (option) => optionLabelMap[option] || option;

  const getParticipationErrorKey = (option, fieldKey) => `${option}.${fieldKey}`;

  const getParticipationTemplate = (eventItem, option) => {
    const forms = Array.isArray(eventItem?.participationForms)
      ? eventItem.participationForms
      : [];

    const matched = forms.find((form) => form.option === option);
    return Array.isArray(matched?.questions) ? matched.questions : [];
  };

  const getStudentApplicationStatus = (eventItem, option) => {
    if (!user?._id) return null;

    const applications = Array.isArray(eventItem.participationApplications)
      ? eventItem.participationApplications
      : [];

    const found = applications.find((entry) => {
      const studentId = typeof entry.student === 'object' ? entry.student?._id : entry.student;
      return String(studentId) === String(user._id) && entry.option === option;
    });

    return found?.status || null;
  };

  const validateParticipationField = (eventItem, option, fieldKey, value) => {
    const trimmed = String(value || '').trim();
    const templateQuestions = getParticipationTemplate(eventItem, option);
    const hasTemplate = templateQuestions.length > 0;

    if (hasTemplate) {
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

  const getAllParticipationErrors = (eventItem, options, answersByOption) => {
    const allErrors = {};

    options.forEach((option) => {
      const optionAnswers = answersByOption[option] || {};
      const templateQuestions = getParticipationTemplate(eventItem, option);
      const hasTemplate = templateQuestions.length > 0;

      if (hasTemplate) {
        templateQuestions.forEach((question) => {
          const key = getParticipationErrorKey(option, question.key);
          const error = validateParticipationField(eventItem, option, question.key, optionAnswers[question.key]);
          if (error) allErrors[key] = error;
        });
        return;
      }

      ['fullName', 'email', 'phone', 'notes'].forEach((fieldKey) => {
        const key = getParticipationErrorKey(option, fieldKey);
        const error = validateParticipationField(eventItem, option, fieldKey, optionAnswers[fieldKey]);
        if (error) allErrors[key] = error;
      });
    });

    return allErrors;
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

  const hasStudentApplied = (eventItem, option) => {
    if (!user?._id) return false;

    const alreadyAppliedInSession = !!appliedMap[`${eventItem._id}:${option}`];
    if (alreadyAppliedInSession) return true;

    const applications = Array.isArray(eventItem.participationApplications)
      ? eventItem.participationApplications
      : [];

    return applications.some((entry) => {
      const studentId = typeof entry.student === 'object' ? entry.student?._id : entry.student;
      return String(studentId) === String(user._id) && entry.option === option;
    });
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

    if (!selectedEvent) return;

    const errorKey = getParticipationErrorKey(option, fieldKey);
    const error = validateParticipationField(selectedEvent, option, fieldKey, value);
    setParticipationFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[errorKey] = error;
      else delete next[errorKey];
      return next;
    });
  };

  const handleParticipationFieldBlur = (option, fieldKey, value) => {
    if (!selectedEvent) return;

    const errorKey = getParticipationErrorKey(option, fieldKey);
    const error = validateParticipationField(selectedEvent, option, fieldKey, value);

    setParticipationFieldTouched((prev) => ({
      ...prev,
      [errorKey]: true,
    }));

    setParticipationFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[errorKey] = error;
      else delete next[errorKey];
      return next;
    });
  };

  const getExistingPendingApplicationMeta = (eventId, option) => {
    const key = getApplicationKey(eventId, option);
    const metadata = applicationMetaMap[key];

    if (!metadata || String(metadata.status || '').toLowerCase() !== 'pending') {
      return null;
    }

    return metadata;
  };

  const buildOptionAnswersFromSavedApplication = (eventItem, option, savedApplication) => {
    const templateQuestions = getParticipationTemplate(eventItem, option);

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

  const handleEditPendingApplication = (option) => {
    if (!selectedEvent) return;

    const metadata = getExistingPendingApplicationMeta(selectedEvent._id, option);
    if (!metadata?.id) return;

    setSelectedOptions([option]);
    setApplicationAnswersByOption({
      [option]: buildOptionAnswersFromSavedApplication(selectedEvent, option, metadata.application),
    });
    setApplyError('');
    setApplyMessage(`Editing pending application for ${formatOptionLabel(option)}.`);
  };

  const handleRemovePendingApplication = async (eventId, option) => {
    const metadata = getExistingPendingApplicationMeta(eventId, option);
    if (!metadata?.id) return;

    const applyKey = `${eventId}:${option}:remove`;
    setApplyingKey(applyKey);
    setApplyError('');
    setApplyMessage('');

    try {
      await removeParticipationApplication(eventId, metadata.id);
      const key = getApplicationKey(eventId, option);

      setApplicationStatusMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      setApplicationMetaMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      setSelectedOptions((prev) => prev.filter((value) => value !== option));
      setApplicationAnswersByOption((prev) => {
        const next = { ...prev };
        delete next[option];
        return next;
      });

      setApplyMessage(`Removed pending application for ${formatOptionLabel(option)}.`);
    } catch (err) {
      setApplyError(err.message || 'Unable to remove pending application right now.');
    } finally {
      setApplyingKey('');
    }
  };

  const handleApplySelected = async (eventId) => {
    if (!selectedEvent || selectedOptions.length === 0) {
      setApplyError('Please select at least one participation option.');
      return;
    }

    setParticipationSubmitAttempted(true);
    const allErrors = getAllParticipationErrors(selectedEvent, selectedOptions, applicationAnswersByOption);
    setParticipationFieldErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      const touchedAll = { ...participationFieldTouched };
      Object.keys(allErrors).forEach((key) => {
        touchedAll[key] = true;
      });
      setParticipationFieldTouched(touchedAll);
      setApplyError('Please fix form validation errors before submitting.');
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

          if (!askNameRegex.test(fullName)) {
            throw new Error(`Name must contain only letters for ${formatOptionLabel(option)}.`);
          }

          if (!emailHasAtRegex.test(email)) {
            throw new Error(`Email must include @ for ${formatOptionLabel(option)}.`);
          }

          if (!askPhoneRegex.test(phone)) {
            throw new Error(`Phone number must contain exactly 10 digits for ${formatOptionLabel(option)}.`);
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

      const submissionResults = [];
      for (const submission of validatedSubmissions) {
        const metadata = getExistingPendingApplicationMeta(eventId, submission.option);

        if (metadata?.id) {
          const response = await updateParticipationApplication(eventId, metadata.id, {
            application: submission.application,
          });

          submissionResults.push({
            ...submission,
            applicationId: response?.applicationId || metadata.id,
            action: 'updated',
          });
        } else {
          const response = await applyForParticipation(eventId, {
            option: submission.option,
            application: submission.application,
          });

          submissionResults.push({
            ...submission,
            applicationId: response?.applicationId || '',
            action: 'created',
          });
        }
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

      setAppliedMap((prev) => {
        const next = { ...prev };
        appliedKeys.forEach((key) => {
          next[key] = true;
        });
        return next;
      });

      setApplicationMetaMap((prev) => {
        const next = { ...prev };
        submissionResults.forEach((result) => {
          const key = getApplicationKey(eventId, result.option);
          next[key] = {
            id: result.applicationId || next[key]?.id || '',
            status: 'pending',
            application: result.application,
          };
        });
        return next;
      });

      const updatedCount = submissionResults.filter((entry) => entry.action === 'updated').length;
      const createdCount = submissionResults.length - updatedCount;

      if (updatedCount > 0 && createdCount > 0) {
        setApplyMessage(`Updated ${updatedCount} and submitted ${createdCount} participation application${submissionResults.length > 1 ? 's' : ''}.`);
      } else if (updatedCount > 0) {
        setApplyMessage(`Updated ${updatedCount} pending participation application${updatedCount > 1 ? 's' : ''}.`);
      } else {
        setApplyMessage(
          `Application submitted for ${submissionResults.length} participation option${submissionResults.length > 1 ? 's' : ''}.`
        );
      }

      const newApplications = submissionResults.map((submission) => ({
        student: user?._id,
        option: submission.option,
        application: submission.application,
        _id: submission.applicationId || undefined,
        appliedAt: new Date().toISOString(),
        status: 'pending',
      }));

      setItems((prev) =>
        prev.map((eventItem) => {
          if (eventItem._id !== eventId) return eventItem;
          const existingApps = Array.isArray(eventItem.participationApplications)
            ? eventItem.participationApplications
            : [];

          const filteredExisting = existingApps.filter((entry) => {
            const studentId = typeof entry.student === 'object' ? entry.student?._id : entry.student;
            return !newApplications.some(
              (submission) => String(studentId) === String(user?._id) && submission.option === entry.option
            );
          });

          return {
            ...eventItem,
            participationApplications: [...filteredExisting, ...newApplications],
          };
        })
      );

      setSelectedEvent((prev) => {
        if (!prev || prev._id !== eventId) return prev;
        const existingApps = Array.isArray(prev.participationApplications)
          ? prev.participationApplications
          : [];

        const filteredExisting = existingApps.filter((entry) => {
          const studentId = typeof entry.student === 'object' ? entry.student?._id : entry.student;
          return !newApplications.some(
            (submission) => String(studentId) === String(user?._id) && submission.option === entry.option
          );
        });

        return {
          ...prev,
          participationApplications: [...filteredExisting, ...newApplications],
        };
      });

      setSelectedOptions([]);
      setApplicationAnswersByOption({});
      setParticipationFieldErrors({});
      setParticipationFieldTouched({});
      setParticipationSubmitAttempted(false);
    } catch (err) {
      setApplyError(err.message || 'Unable to submit application right now.');
    } finally {
      setApplyingKey('');
    }
  };

  const validateAskField = (field, value) => {
    const trimmed = String(value || '').trim();

    if (!trimmed) {
      return `${field.charAt(0).toUpperCase()}${field.slice(1)} is required.`;
    }

    if (field === 'name' && !askNameRegex.test(trimmed)) {
      return 'Name must contain letters only. Numbers are not allowed.';
    }

    if (field === 'email' && !trimmed.includes('@')) {
      return 'Email must include the @ symbol.';
    }

    if (field === 'phone' && !askPhoneRegex.test(trimmed)) {
      return 'Phone number must contain exactly 10 digits.';
    }

    return '';
  };

  const validateAskForm = (formData) => {
    const nextErrors = {};

    ['name', 'email', 'phone', 'question'].forEach((field) => {
      const fieldError = validateAskField(field, formData[field]);
      if (fieldError) {
        nextErrors[field] = fieldError;
      }
    });

    return nextErrors;
  };

  const askFormValidationErrors = validateAskForm(askForm);
  const isAskFormValid = Object.keys(askFormValidationErrors).length === 0;

  const handleAskFieldChange = (field, value) => {
    let nextValue = value;

    if (field === 'name') {
      nextValue = value.replace(/[^A-Za-z\s]/g, '');
    }

    if (field === 'phone') {
      nextValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setAskForm((prev) => ({
      ...prev,
      [field]: nextValue,
    }));

    setAskFormMessage('');

    setAskFormErrors((prev) => {
      const next = { ...prev };
      const fieldError = validateAskField(field, nextValue);

      if (fieldError) {
        next[field] = fieldError;
      } else {
        delete next[field];
      }

      return next;
    });
  };

  const handleAskFieldBlur = (field) => {
    setAskFormTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    setAskFormErrors((prev) => {
      const next = { ...prev };
      const fieldError = validateAskField(field, askForm[field]);

      if (fieldError) {
        next[field] = fieldError;
      } else {
        delete next[field];
      }

      return next;
    });
  };

  const handleAskFormSubmit = (event) => {
    event.preventDefault();
    setAskSubmitAttempted(true);

    const nextErrors = validateAskForm(askForm);
    setAskFormErrors(nextErrors);
    setAskFormTouched({
      name: true,
      email: true,
      phone: true,
      question: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setAskFormMessage('Please fix the validation errors before submitting.');
      return;
    }

    setAskFormMessage('Your question has been captured. Chatbot reply support will be available soon.');
    setAskForm({
      name: '',
      email: '',
      phone: '',
      question: '',
    });
    setAskFormTouched({});
    setAskFormErrors({});
    setAskSubmitAttempted(false);
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

        {/* Content Section */}
        <section className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading upcoming events...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 p-8">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-xl font-semibold text-gray-800 mb-2">Unable to load events</p>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : upcomingItems.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 p-8">
              <div className="text-6xl mb-4">🎪</div>
              <p className="text-xl font-semibold text-gray-800 mb-2">No upcoming events available</p>
              <p className="text-gray-600">Stay tuned for the next campus event!</p>
            </div>
          ) : (
            <>
              {applyMessage ? <p className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{applyMessage}</p> : null}
              {applyError ? <p className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{applyError}</p> : null}

              {isStudent ? (
                <div className="mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-green-100 rounded-xl">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">Have a question about an event?</h3>
                      <p className="text-sm text-gray-600">Use the button to open the upcoming student event chatbot area.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAskPanelOpen((prev) => !prev)}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300"
                    >
                      Ask About Events
                    </button>
                  </div>

                  {isAskPanelOpen ? (
                    <div className="mt-3 p-5 bg-green-50 border border-green-200 rounded-xl">
                      <h4 className="text-sm font-semibold text-green-800 mb-3">Ask About Events</h4>

                      <form className="space-y-4" onSubmit={handleAskFormSubmit} noValidate>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                          <input
                            type="text"
                            value={askForm.name}
                            onChange={(event) => handleAskFieldChange('name', event.target.value)}
                            onBlur={() => handleAskFieldBlur('name')}
                            placeholder="Enter your full name"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {(askSubmitAttempted || askFormTouched.name) && askFormErrors.name ? (
                            <p className="text-xs text-red-600 mt-1">{askFormErrors.name}</p>
                          ) : null}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input
                            type="text"
                            value={askForm.email}
                            onChange={(event) => handleAskFieldChange('email', event.target.value)}
                            onBlur={() => handleAskFieldBlur('email')}
                            placeholder="Enter your email"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {(askSubmitAttempted || askFormTouched.email) && askFormErrors.email ? (
                            <p className="text-xs text-red-600 mt-1">{askFormErrors.email}</p>
                          ) : null}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                          <input
                            type="text"
                            value={askForm.phone}
                            onChange={(event) => handleAskFieldChange('phone', event.target.value)}
                            onBlur={() => handleAskFieldBlur('phone')}
                            placeholder="Enter 10-digit phone number"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {(askSubmitAttempted || askFormTouched.phone) && askFormErrors.phone ? (
                            <p className="text-xs text-red-600 mt-1">{askFormErrors.phone}</p>
                          ) : null}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                          <textarea
                            rows={3}
                            value={askForm.question}
                            onChange={(event) => handleAskFieldChange('question', event.target.value)}
                            onBlur={() => handleAskFieldBlur('question')}
                            placeholder="Type your question about events"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {(askSubmitAttempted || askFormTouched.question) && askFormErrors.question ? (
                            <p className="text-xs text-red-600 mt-1">{askFormErrors.question}</p>
                          ) : null}
                        </div>

                        {askFormMessage ? (
                          <p className={`text-sm ${Object.keys(askFormErrors).length > 0 ? 'text-red-600' : 'text-green-700'}`}>
                            {askFormMessage}
                          </p>
                        ) : null}

                        <button
                          type="submit"
                          disabled={!isAskFormValid}
                          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
                        >
                          Submit Question
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Events Grid */}
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
            </>
          )}
        </section>

        {/* Event Details Modal */}
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
                                    onBlur={(event) =>
                                      handleParticipationFieldBlur(option, question.key, event.target.value)
                                    }
                                    required={question.required !== false}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                  {(participationSubmitAttempted || participationFieldTouched[getParticipationErrorKey(option, question.key)])
                                    && participationFieldErrors[getParticipationErrorKey(option, question.key)] ? (
                                      <p className="text-xs text-red-600 mt-1">
                                        {participationFieldErrors[getParticipationErrorKey(option, question.key)]}
                                      </p>
                                    ) : null}
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
                                    onBlur={(event) =>
                                      handleParticipationFieldBlur(option, 'fullName', event.target.value)
                                    }
                                    required
                                    pattern="[A-Za-z\s]+"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                  {(participationSubmitAttempted || participationFieldTouched[getParticipationErrorKey(option, 'fullName')])
                                    && participationFieldErrors[getParticipationErrorKey(option, 'fullName')] ? (
                                      <p className="text-xs text-red-600 mt-1">
                                        {participationFieldErrors[getParticipationErrorKey(option, 'fullName')]}
                                      </p>
                                    ) : null}
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
                                    onBlur={(event) =>
                                      handleParticipationFieldBlur(option, 'email', event.target.value)
                                    }
                                    required
                                    pattern="[^\s@]+@[^\s@]+"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                  {(participationSubmitAttempted || participationFieldTouched[getParticipationErrorKey(option, 'email')])
                                    && participationFieldErrors[getParticipationErrorKey(option, 'email')] ? (
                                      <p className="text-xs text-red-600 mt-1">
                                        {participationFieldErrors[getParticipationErrorKey(option, 'email')]}
                                      </p>
                                    ) : null}
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
                                    onBlur={(event) =>
                                      handleParticipationFieldBlur(option, 'phone', event.target.value)
                                    }
                                    placeholder="07X XXX XXXX"
                                    required
                                    pattern="\d{10}"
                                    minLength={10}
                                    maxLength={10}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                  {(participationSubmitAttempted || participationFieldTouched[getParticipationErrorKey(option, 'phone')])
                                    && participationFieldErrors[getParticipationErrorKey(option, 'phone')] ? (
                                      <p className="text-xs text-red-600 mt-1">
                                        {participationFieldErrors[getParticipationErrorKey(option, 'phone')]}
                                      </p>
                                    ) : null}
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
                                  onBlur={(event) =>
                                    handleParticipationFieldBlur(option, 'notes', event.target.value)
                                  }
                                  placeholder="Share your relevant skills, interest, or experience."
                                  required
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {(participationSubmitAttempted || participationFieldTouched[getParticipationErrorKey(option, 'notes')])
                                  && participationFieldErrors[getParticipationErrorKey(option, 'notes')] ? (
                                    <p className="text-xs text-red-600 mt-1">
                                      {participationFieldErrors[getParticipationErrorKey(option, 'notes')]}
                                    </p>
                                  ) : null}
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
                          setParticipationFieldErrors({});
                          setParticipationFieldTouched({});
                          setParticipationSubmitAttempted(false);
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
                            const metadata = getExistingPendingApplicationMeta(selectedEvent._id, option);
                            const canManagePending = applied && String(status).toLowerCase() === 'pending' && !!metadata?.id;
                            const removingCurrent = applyingKey === `${selectedEvent._id}:${option}:remove`;

                            return (
                              <div key={option} className="flex items-center gap-2">
                                <button
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

                                {canManagePending ? (
                                  <>
                                    <button
                                      type="button"
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-200"
                                      onClick={() => handleEditPendingApplication(option)}
                                    >
                                      Update
                                    </button>
                                    <button
                                      type="button"
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200 disabled:opacity-50"
                                      onClick={() => handleRemovePendingApplication(selectedEvent._id, option)}
                                      disabled={removingCurrent}
                                    >
                                      {removingCurrent ? 'Removing...' : 'Remove'}
                                    </button>
                                  </>
                                ) : null}
                              </div>
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
                              // Form will show when options are selected
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
