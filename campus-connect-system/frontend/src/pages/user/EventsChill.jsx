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
const [applicationStatusMap, setApplicationStatusMap] = useState({});
const [applicationMetaMap, setApplicationMetaMap] = useState({});
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

// ... rest of validateAskForm, handleAskFieldChange, handleAskFieldBlur, handleAskFormSubmit, and return JSX
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
{applied ? `(${statusMeta.label})` : selected ? '✓' : ''}
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
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Student ID
    <span className="text-red-500 ml-1">*</span>
  </label>
  <input
    type="text"
    value={optionAnswers.studentId || ''}
    onChange={(event) =>
      handleApplicationFieldChange(option, 'studentId', event.target.value)
    }
    onBlur={(event) =>
      handleParticipationFieldBlur(option, 'studentId', event.target.value)
    }
    required
    minLength={10}
    maxLength={10}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
  />
  {(participationSubmitAttempted || participationFieldTouched[getParticipationErrorKey(option, 'studentId')])
    && participationFieldErrors[getParticipationErrorKey(option, 'studentId')] ? (
      <p className="text-xs text-red-600 mt-1">
        {participationFieldErrors[getParticipationErrorKey(option, 'studentId')]}
      </p>
    ) : null}
</div>
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
<pattern="0\d{9}"
minLength={10}
maxLength={10}
inputMode="numeric"
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
    className="flex-1 px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition-all duration-300"
    onClick={() => {
      if (!selectedEvent) return;

      setApplicationAnswersByOption((prev) => {
        const next = { ...prev };
        selectedOptions.forEach((option) => {
          next[option] = createBlankAnswersForOption(selectedEvent, option);
        });
        return next;
      });

      setParticipationFieldErrors({});
      setParticipationFieldTouched({});
      setParticipationSubmitAttempted(false);
      setApplyError('');
      setApplyMessage('');
    }}
  >
    Clear Form
  </button>
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
{formatOptionLabel(option)} {applied ? `(${statusMeta.label})` : selected ? '✓' : ''}
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

{isStudent && selectedEvent.participationOptions && selectedEvent.participationOptions.length > 0 && (
  // Action Buttons
  <div className="flex gap-3 mt-6">
    {/* your buttons here */}
  </div>
)}
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
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
