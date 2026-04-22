import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
const askEventsImage = 'https://img.freepik.com/free-vector/chat-bot-concept-illustration_114360-5522.jpg';
const EVENT_TYPE_OPTIONS = [
  { value: 'chill_session', label: 'Chill Session' },
  { value: 'club_event', label: 'Club Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'conference', label: 'Conference' },
  { value: 'cultural_event', label: 'Cultural Event' },
  { value: 'exhibition', label: 'Exhibition' },
];

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
const askPhoneRegex = /^0\d{9}$/; // Phone must start with 0 and have exactly 10 digits
const emailHasAtRegex = /^[^\s@]+@[^\s@]+$/;
const studentIdRegex = /^.{10}$/; // Student ID must be exactly 10 characters

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

const getEventTypeLabel = (eventType) => {
  const matched = EVENT_TYPE_OPTIONS.find((option) => option.value === eventType);
  return matched?.label || 'Club Event';
};
export default function EventsChill() {
  const navigate = useNavigate();
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
const [applicationStatusMap, setApplicationStatusMap] = useState({});
const [applicationMetaMap, setApplicationMetaMap] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [applicationAnswersByOption, setApplicationAnswersByOption] = useState({});
  const [participationFieldErrors, setParticipationFieldErrors] = useState({});
  const [participationFieldTouched, setParticipationFieldTouched] = useState({});
  const [participationSubmitAttempted, setParticipationSubmitAttempted] = useState(false);
const [myEventRequests, setMyEventRequests] = useState([]);
const [activeTab, setActiveTab] = useState('events');
const [selectedEventType, setSelectedEventType] = useState('all');
const [searchEventName, setSearchEventName] = useState('');

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
    if (!isStudent) return;

    getMyEventApplications()
      .then((rows) => {
        setMyEventRequests(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        setMyEventRequests([]);
      });
  }, [isStudent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const upcomingItems = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const normalizedSearch = searchEventName.trim().toLowerCase();

    return [...items]
      .filter((item) => new Date(item.date).getTime() >= todayStart.getTime())
      .filter((item) => selectedEventType === 'all' || item.eventType === selectedEventType)
      .filter((item) => {
        if (!normalizedSearch) return true;
        return String(item.title || '').toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items, searchEventName, selectedEventType]);

  const myRequestsWithEventDetails = useMemo(() => {
    const byEventId = new Map(items.map((eventItem) => [String(eventItem._id), eventItem]));

    return myEventRequests.map((request) => {
      const requestEventId = String(request.eventId?._id || request.eventId || '');
      const matchedEvent = byEventId.get(requestEventId);

      return {
        ...request,
        requestEventId,
        eventTitle: request.eventTitle || matchedEvent?.title || 'Event',
        eventDate: request.eventDate || matchedEvent?.date || request.appliedAt,
        eventType: request.eventType || matchedEvent?.eventType || 'event',
      };
    });
  }, [items, myEventRequests]);

  const formatOptionLabel = (option) => optionLabelMap[option] || option;

  const getParticipationErrorKey = (option, fieldKey) => `${option}.${fieldKey}`;

  const getParticipationTemplate = (eventItem, option) => {
    const forms = Array.isArray(eventItem?.participationForms)
      ? eventItem.participationForms
      : [];

    const matched = forms.find((form) => form.option === option);
    return Array.isArray(matched?.questions) ? matched.questions : [];
  };

  const validateParticipationField = (eventItem, option, fieldKey, value) => {
    const trimmed = String(value || '').trim();
    const templateQuestions = getParticipationTemplate(eventItem, option);
    const hasTemplate = templateQuestions.length > 0;

    if (hasTemplate) {
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

['fullName', 'studentId', 'email', 'phone', 'notes'].forEach((fieldKey) => {
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
      studentId: '',
      email: user?.email || '',
      phone: '',
      notes: '',
    };
  };

  const createBlankAnswersForOption = (eventItem, option) => {
    const templateQuestions = getParticipationTemplate(eventItem, option);

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

  const getStudentApplicationStatus = (eventItem, option) => {
    if (!user?._id || !eventItem?._id) return '';

    const key = getApplicationKey(eventItem._id, option);
    const cachedStatus = applicationStatusMap[key];
    if (cachedStatus) return String(cachedStatus).toLowerCase();

    const cachedMetaStatus = applicationMetaMap[key]?.status;
    if (cachedMetaStatus) return String(cachedMetaStatus).toLowerCase();

    const applications = Array.isArray(eventItem.participationApplications)
      ? eventItem.participationApplications
      : [];

    const matched = applications.find((entry) => {
      const studentId = typeof entry.student === 'object' ? entry.student?._id : entry.student;
      return String(studentId) === String(user._id) && entry.option === option;
    });

    if (matched?.status) return String(matched.status).toLowerCase();
    if (appliedMap[key]) return 'pending';

    return '';
  };

  const openEventDetails = (eventItem) => {
    navigate(`/user/events-chill/${eventItem._id}`);
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
studentId: savedApplication?.studentId || '',
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
          const studentId = String(optionAnswers.studentId || '').trim();
          const email = String(optionAnswers.email || '').trim();
          const phone = String(optionAnswers.phone || '').trim();
          const notes = String(optionAnswers.notes || '').trim();

          if (!fullName || !studentId || !email || !phone || !notes) {
            throw new Error(`Please complete the application form for ${formatOptionLabel(option)}.`);
          }

if (!studentIdRegex.test(studentId)) {
  throw new Error(`Student ID must contain exactly 10 characters for ${formatOptionLabel(option)}.`);
}
          if (!askNameRegex.test(fullName)) {
            throw new Error(`Name must contain only letters for ${formatOptionLabel(option)}.`);
          }

          if (!emailHasAtRegex.test(email)) {
            throw new Error(`Email must include @ for ${formatOptionLabel(option)}.`);
          }

          if (!askPhoneRegex.test(phone)) {
throw new Error(`Phone number must start with 0 and contain exactly 10 digits for ${formatOptionLabel(option)}.`);
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
            studentId: optionAnswers.studentId || '',
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

    if (field === 'email' && !emailHasAtRegex.test(trimmed)) {
      return 'Email must include @.';
    }

    if (field === 'phone' && !askPhoneRegex.test(trimmed)) {
      return 'Phone number must start with 0 and contain exactly 10 digits.';
    }

    return '';
  };

  const validateAskForm = (values) => ({
    name: validateAskField('name', values.name),
    email: validateAskField('email', values.email),
    phone: validateAskField('phone', values.phone),
    question: validateAskField('question', values.question),
  });

  const handleAskFieldChange = (field, value) => {
    setAskForm((prev) => ({ ...prev, [field]: value }));
    if (askSubmitAttempted || askFormTouched[field]) {
      setAskFormErrors((prev) => ({ ...prev, [field]: validateAskField(field, value) }));
    }
  };

  const handleAskFieldBlur = (field, value) => {
    setAskFormTouched((prev) => ({ ...prev, [field]: true }));
    setAskFormErrors((prev) => ({ ...prev, [field]: validateAskField(field, value) }));
  };

  const handleAskFormSubmit = (event) => {
    event.preventDefault();
    setAskSubmitAttempted(true);

    const nextErrors = validateAskForm(askForm);
    setAskFormErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) return;

    setAskFormMessage('Your question has been recorded. A coordinator will contact you soon.');
    setAskFormTouched({});
    setAskForm({ name: '', email: '', phone: '', question: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Events and Chill Sessions</h1>
          <p className="text-gray-600 mt-2">Discover upcoming campus events and apply for participation roles.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'events' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Upcoming Events
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'requests' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              My Requests
            </button>
            <button
              type="button"
              onClick={() => setIsAskPanelOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200"
            >
              Ask About Events
            </button>
          </div>
        </section>

        {error ? <p className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</p> : null}
        {applyError ? <p className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{applyError}</p> : null}
        {applyMessage ? <p className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">{applyMessage}</p> : null}

        {activeTab === 'events' ? (
          <>
            <section className="mb-6 flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={searchEventName}
                onChange={(event) => setSearchEventName(event.target.value)}
                placeholder="Search by event name"
                className="w-full md:w-2/3 px-3 py-2 border border-gray-200 rounded-lg"
              />
              <select
                value={selectedEventType}
                onChange={(event) => setSelectedEventType(event.target.value)}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="all">All event types</option>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </section>

            {loading ? (
              <p className="text-gray-500">Loading events...</p>
            ) : upcomingItems.length === 0 ? (
              <p className="text-gray-500">No upcoming events found.</p>
            ) : (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingItems.map((item) => {
                  const countdown = getCountdownData(item.date, now);
                  return (
                    <article key={item._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      {resolveImageUrl(item.image) ? (
                        <img src={resolveImageUrl(item.image)} alt={item.title} className="h-44 w-full object-cover" />
                      ) : null}
                      <div className="p-5">
                        <p className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 inline-flex px-2 py-1 rounded-full">
                          {getEventTypeLabel(item.eventType)}
                        </p>
                        <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{new Date(item.date).toLocaleString('en-GB')}</p>
                        <p className="text-sm text-gray-600">{item.location || 'TBA'}</p>
                        <p className={`mt-2 text-xs font-semibold ${countdown.status === 'ended' ? 'text-red-600' : countdown.status === 'started' ? 'text-amber-600' : 'text-blue-600'}`}>
                          {countdown.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => openEventDetails(item)}
                          className="mt-4 w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold"
                        >
                          View Details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        ) : (
          <section className="bg-white border border-gray-100 rounded-2xl p-5">
            {myRequestsWithEventDetails.length === 0 ? (
              <p className="text-gray-500">No participation requests yet.</p>
            ) : (
              <div className="space-y-3">
                {myRequestsWithEventDetails.map((request) => {
                  const meta = getStatusMeta(request.status);
                  return (
                    <article key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900">{request.eventTitle}</p>
                      <p className="text-sm text-gray-600">{new Date(request.eventDate).toLocaleString('en-GB')}</p>
                      <p className="text-sm text-gray-600">Role: {formatOptionLabel(request.option)}</p>
                      <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
                        {meta.label || 'Unknown'}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {selectedEvent ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeEventDetails}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">{selectedOptions.length > 0 ? 'Application Form' : 'Event Details'}</h3>
                <button type="button" onClick={closeEventDetails} className="text-gray-500">X</button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[75vh] space-y-5">
                {selectedOptions.length > 0 ? (
                  <form
                    className="space-y-5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleApplySelected(selectedEvent._id);
                    }}
                  >
                    {selectedOptions.map((option) => {
                      const templateQuestions = getParticipationTemplate(selectedEvent, option);
                      const answers = applicationAnswersByOption[option] || {};
                      return (
                        <div key={option} className="border border-gray-200 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-gray-800">{formatOptionLabel(option)}</h4>
                          {templateQuestions.length > 0 ? (
                            templateQuestions.map((question) => (
                              <div key={`${option}-${question.key}`}>
                                <label className="block text-sm text-gray-700 mb-1">{question.label}</label>
                                <textarea
                                  rows={3}
                                  value={answers[question.key] || ''}
                                  onChange={(event) => handleApplicationFieldChange(option, question.key, event.target.value)}
                                  onBlur={(event) => handleParticipationFieldBlur(option, question.key, event.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                              </div>
                            ))
                          ) : (
                            <>
                              {['fullName', 'studentId', 'email', 'phone', 'notes'].map((fieldKey) => (
                                <div key={`${option}-${fieldKey}`}>
                                  <label className="block text-sm text-gray-700 mb-1">{fieldKey}</label>
                                  {fieldKey === 'notes' ? (
                                    <textarea
                                      rows={3}
                                      value={answers[fieldKey] || ''}
                                      onChange={(event) => handleApplicationFieldChange(option, fieldKey, event.target.value)}
                                      onBlur={(event) => handleParticipationFieldBlur(option, fieldKey, event.target.value)}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    />
                                  ) : (
                                    <input
                                      type={fieldKey === 'email' ? 'email' : 'text'}
                                      value={answers[fieldKey] || ''}
                                      onChange={(event) => handleApplicationFieldChange(option, fieldKey, event.target.value)}
                                      onBlur={(event) => handleParticipationFieldBlur(option, fieldKey, event.target.value)}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    />
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setSelectedOptions([])} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold">Back</button>
                      <button type="submit" disabled={applyingKey === selectedEvent._id} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-60">
                        {applyingKey === selectedEvent._id ? 'Submitting...' : 'Submit Applications'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {resolveImageUrl(selectedEvent.image) ? (
                      <img src={resolveImageUrl(selectedEvent.image)} alt={selectedEvent.title} className="h-52 w-full object-cover rounded-lg" />
                    ) : null}
                    <h4 className="text-2xl font-semibold text-gray-900">{selectedEvent.title}</h4>
                    <p className="text-gray-600">{selectedEvent.description || 'No description provided.'}</p>

                    {Array.isArray(selectedEvent.participationOptions) && selectedEvent.participationOptions.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700 uppercase">Participation Options</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.participationOptions.map((option) => {
                            const status = getStudentApplicationStatus(selectedEvent, option);
                            const statusMeta = getStatusMeta(status);
                            const selected = selectedOptions.includes(option);
                            const metadata = getExistingPendingApplicationMeta(selectedEvent._id, option);
                            const canManagePending = String(status).toLowerCase() === 'pending' && !!metadata?.id;
                            return (
                              <div key={option} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={!!status}
                                  onClick={() => toggleApplicationOption(option)}
                                  className={
                                    status
                                      ? `px-3 py-1.5 rounded-full text-xs font-semibold cursor-default ${statusMeta.className}`
                                      : `px-3 py-1.5 rounded-full text-xs font-semibold border ${selected ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-700'}`
                                  }
                                >
                                  {formatOptionLabel(option)} {status ? `(${statusMeta.label})` : selected ? '✓' : ''}
                                </button>
                                {canManagePending ? (
                                  <>
                                    <button type="button" onClick={() => handleEditPendingApplication(option)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Update</button>
                                    <button type="button" onClick={() => handleRemovePendingApplication(selectedEvent._id, option)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Remove</button>
                                  </>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <button type="button" onClick={closeEventDetails} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold">Close</button>
                      {selectedOptions.length > 0 ? (
                        <button type="button" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">Apply Now</button>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {isAskPanelOpen ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setIsAskPanelOpen(false)}>
            <div className="bg-white rounded-2xl w-full max-w-xl p-6" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Ask About Events</h3>
                <button type="button" onClick={() => setIsAskPanelOpen(false)} className="text-gray-500">X</button>
              </div>
              <img src={askEventsImage} alt="Ask events" className="w-full h-36 object-cover rounded-lg mb-4" />
              {askFormMessage ? <p className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{askFormMessage}</p> : null}
              <form onSubmit={handleAskFormSubmit} className="space-y-3">
                {['name', 'email', 'phone'].map((field) => (
                  <div key={field}>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={askForm[field]}
                      onChange={(event) => handleAskFieldChange(field, event.target.value)}
                      onBlur={(event) => handleAskFieldBlur(field, event.target.value)}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    {(askSubmitAttempted || askFormTouched[field]) && askFormErrors[field] ? (
                      <p className="text-xs text-red-600 mt-1">{askFormErrors[field]}</p>
                    ) : null}
                  </div>
                ))}
                <div>
                  <textarea
                    rows={4}
                    value={askForm.question}
                    onChange={(event) => handleAskFieldChange('question', event.target.value)}
                    onBlur={(event) => handleAskFieldBlur('question', event.target.value)}
                    placeholder="Your question"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  {(askSubmitAttempted || askFormTouched.question) && askFormErrors.question ? (
                    <p className="text-xs text-red-600 mt-1">{askFormErrors.question}</p>
                  ) : null}
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">Submit Question</button>
              </form>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
