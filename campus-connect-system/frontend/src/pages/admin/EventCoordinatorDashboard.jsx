import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  createEvent,
  deleteEvent,
  getAllEvents,
  updateEventApplicationStatus,
  updateEvent,
} from '../../services/adminEventsService';
import { PARTICIPATION_OPTIONS } from '../../utils/constants';

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const INITIAL_FORM = {
  title: '',
  eventType: 'club_event',
  date: '',
  time: '',
  location: '',
  description: '',
  image: '',
  participationOptions: [],
  participationForms: {},
  participationBaseFields: {},
};

const APPLICATION_FORM_FIELDS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'student_id', label: 'Registration Number' },
];

const APPLICATION_FORM_FIELD_KEYS = new Set(APPLICATION_FORM_FIELDS.map((field) => field.key));

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${BACKEND_ORIGIN}${imagePath}`;
};

const formatCardDate = (eventDate) =>
  new Date(eventDate).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatCardTime = (event) => {
  if (event.time) return event.time;
  return new Date(event.date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const EVENT_TYPE_OPTIONS = [
  { value: 'chill_session', label: 'Chill Session' },
  { value: 'club_event', label: 'Club Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'conference', label: 'Conference' },
  { value: 'cultural_event', label: 'Cultural Event' },
  { value: 'exhibition', label: 'Exhibition' },
];

const getEventTypeLabel = (eventType) => {
  const matched = EVENT_TYPE_OPTIONS.find((option) => option.value === eventType);
  return matched?.label || 'Club Event';
};
const getApplicationStatusMeta = (status) => {
  const normalized = String(status || 'pending').toLowerCase();

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

  return {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border border-amber-300',
  };
};

export default function EventCoordinatorDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [reviewingKey, setReviewingKey] = useState('');

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [items]
  );

  const optionLabelMap = useMemo(
    () =>
      PARTICIPATION_OPTIONS.reduce((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {}),
    []
  );

  const applicantCards = useMemo(() => {
    const rows = [];

    sortedItems.forEach((eventItem) => {
      const applications = Array.isArray(eventItem.participationApplications)
        ? eventItem.participationApplications
        : [];

      applications.forEach((entry) => {
        rows.push({
          eventId: eventItem._id,
          eventTitle: eventItem.title,
          entry,
        });
      });
    });

    return rows.sort(
      (a, b) => new Date(b.entry.appliedAt).getTime() - new Date(a.entry.appliedAt).getTime()
    );
  }, [sortedItems]);

  const selectedCategorySummary = useMemo(() => {
    const applications = Array.isArray(selectedItem?.participationApplications)
      ? selectedItem.participationApplications
      : [];
    const selectedOptions = Array.isArray(selectedItem?.participationOptions)
      ? selectedItem.participationOptions
      : [];

    const map = {};

    selectedOptions.forEach((option) => {
      map[option] = { option, total: 0, approved: 0, pending: 0, rejected: 0 };
    });

    applications.forEach((entry) => {
      const option = String(entry.option || '').trim();
      if (!option) return;

      if (!map[option]) {
        map[option] = { option, total: 0, approved: 0, pending: 0, rejected: 0 };
      }

      const normalizedStatus = String(entry.status || 'pending').toLowerCase();
      map[option].total += 1;

      if (normalizedStatus === 'approved') map[option].approved += 1;
      else if (normalizedStatus === 'rejected') map[option].rejected += 1;
      else map[option].pending += 1;
    });

    return Object.values(map);
  }, [selectedItem]);

  const loadEvents = async () => {
    try {
      const data = await getAllEvents();
      setItems(data);
      setError('');
    } catch (err) {
      setItems([]);
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setMessage('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    const mappedForms = {};
    const mappedBaseFields = {};

    if (Array.isArray(item.participationForms)) {
      item.participationForms.forEach((formItem) => {
        const questions = Array.isArray(formItem.questions) ? formItem.questions : [];
        const selected = [];
        const customQuestions = [];

        questions.forEach((question, index) => {
          const questionKey = String(question?.key || '').trim().toLowerCase();
          const questionLabel = String(question?.label || '').trim();
          const normalizedQuestion = {
            key: questionKey || `q_${index + 1}`,
            label: questionLabel,
            required: question?.required !== false,
          };

          if (APPLICATION_FORM_FIELD_KEYS.has(questionKey)) {
            selected.push(questionKey);
            return;
          }

          if (questionLabel) {
            customQuestions.push(normalizedQuestion);
          }
        });

        mappedBaseFields[formItem.option] = selected;
        mappedForms[formItem.option] = customQuestions;
      });
    }

    setEditingItem(item);
    setForm({
      title: item.title || '',
      eventType: item.eventType || 'club_event',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      time: item.time || '',
      location: item.location || '',
      description: item.description || '',
      image: item.image || '',
      participationOptions: Array.isArray(item.participationOptions)
        ? item.participationOptions
        : [],
      participationForms: mappedForms,
      participationBaseFields: mappedBaseFields,
    });
    setMessage('');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(INITIAL_FORM);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleParticipationOptionToggle = (optionValue) => {
    setForm((prev) => {
      const exists = prev.participationOptions.includes(optionValue);

      const nextParticipationForms = { ...prev.participationForms };
      const nextBaseFields = { ...prev.participationBaseFields };
      if (exists) {
        delete nextParticipationForms[optionValue];
        delete nextBaseFields[optionValue];
      } else {
        nextParticipationForms[optionValue] = [];
        nextBaseFields[optionValue] = APPLICATION_FORM_FIELDS.map((field) => field.key);
      }

      return {
        ...prev,
        participationOptions: exists
          ? prev.participationOptions.filter((value) => value !== optionValue)
          : [...prev.participationOptions, optionValue],
        participationForms: nextParticipationForms,
        participationBaseFields: nextBaseFields,
      };
    });
  };

  const handleBaseFieldToggle = (optionValue, fieldKey) => {
    setForm((prev) => {
      const selected = Array.isArray(prev.participationBaseFields[optionValue])
        ? prev.participationBaseFields[optionValue]
        : [];

      const exists = selected.includes(fieldKey);
      const nextSelected = exists
        ? selected.filter((key) => key !== fieldKey)
        : [...selected, fieldKey];

      return {
        ...prev,
        participationBaseFields: {
          ...prev.participationBaseFields,
          [optionValue]: nextSelected,
        },
      };
    });
  };

  const handleAddQuestion = (optionValue) => {
    setForm((prev) => {
      const currentQuestions = Array.isArray(prev.participationForms[optionValue])
        ? prev.participationForms[optionValue]
        : [];

      return {
        ...prev,
        participationForms: {
          ...prev.participationForms,
          [optionValue]: [
            ...currentQuestions,
            {
              key: `q_${Date.now()}`,
              label: '',
              required: true,
            },
          ],
        },
      };
    });
  };

  const handleQuestionChange = (optionValue, questionIndex, field, value) => {
    setForm((prev) => {
      const currentQuestions = Array.isArray(prev.participationForms[optionValue])
        ? prev.participationForms[optionValue]
        : [];

      const updatedQuestions = currentQuestions.map((question, index) => {
        if (index !== questionIndex) return question;
        return { ...question, [field]: value };
      });

      return {
        ...prev,
        participationForms: {
          ...prev.participationForms,
          [optionValue]: updatedQuestions,
        },
      };
    });
  };

  const handleRemoveQuestion = (optionValue, questionIndex) => {
    setForm((prev) => {
      const currentQuestions = Array.isArray(prev.participationForms[optionValue])
        ? prev.participationForms[optionValue]
        : [];

      return {
        ...prev,
        participationForms: {
          ...prev.participationForms,
          [optionValue]: currentQuestions.filter((_, index) => index !== questionIndex),
        },
      };
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        title: form.title,
        date: form.date,
        time: form.time,
        location: form.location,
        description: form.description,
        eventType: form.eventType || 'event',
        image: form.image || '',
        participationOptions: [...form.participationOptions],
      };

      const participationFormsPayload = form.participationOptions.map((option) => {
        const selectedBaseFields = Array.isArray(form.participationBaseFields[option])
          ? form.participationBaseFields[option]
          : [];

        const customQuestions = Array.isArray(form.participationForms[option])
          ? form.participationForms[option]
              .map((question, index) => {
                const questionLabel = String(question?.label || '').trim();
                const questionKey = String(question?.key || '').trim().toLowerCase();

                if (!questionLabel) return null;

                return {
                  key: questionKey || `q_${index + 1}`,
                  label: questionLabel,
                  required: question?.required !== false,
                };
              })
              .filter(Boolean)
          : [];

        return {
          option,
          questions: [
            ...APPLICATION_FORM_FIELDS
              .filter((field) => selectedBaseFields.includes(field.key))
              .map((field) => ({
                key: field.key,
                label: field.label,
                required: true,
              })),
            ...customQuestions,
          ],
        };
      });

      const hasEmptyOptionForm = participationFormsPayload.some(
        (entry) => !Array.isArray(entry.questions) || entry.questions.length === 0
      );

      if (hasEmptyOptionForm) {
        throw new Error('Please select at least one application field for every participation option.');
      }

      payload.participationForms = JSON.stringify(participationFormsPayload);

      if (editingItem) {
        await updateEvent(editingItem._id, payload);
        setMessage('Event updated successfully.');
      } else {
        await createEvent(payload);
        setMessage('Event created successfully.');
      }

      closeModal();
      await loadEvents();
    } catch (err) {
      setError(err.message || 'Unable to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Delete this event? This action cannot be undone.');
    if (!confirmDelete) return;

    setMessage('');
    setError('');
    try {
      await deleteEvent(id);
      setMessage('Event deleted successfully.');
      await loadEvents();
    } catch (err) {
      setError(err.message || 'Unable to delete event.');
    }
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleApplicationStatusUpdate = async (eventId, applicationId, nextStatus) => {
    const requestKey = `${applicationId}:${nextStatus}`;
    setReviewingKey(requestKey);
    setMessage('');
    setError('');

    try {
      await updateEventApplicationStatus(eventId, applicationId, nextStatus);

      setItems((prev) =>
        prev.map((eventItem) => {
          if (String(eventItem._id) !== String(eventId)) return eventItem;

          const updatedApplications = (eventItem.participationApplications || []).map((entry) => {
            if (String(entry._id) !== String(applicationId)) return entry;
            return {
              ...entry,
              status: nextStatus,
              reviewedAt: new Date().toISOString(),
            };
          });

          return {
            ...eventItem,
            participationApplications: updatedApplications,
          };
        })
      );

      setSelectedItem((prev) => {
        if (!prev || String(prev._id) !== String(eventId)) return prev;

        const updatedApplications = (prev.participationApplications || []).map((entry) => {
          if (String(entry._id) !== String(applicationId)) return entry;
          return {
            ...entry,
            status: nextStatus,
            reviewedAt: new Date().toISOString(),
          };
        });

        return {
          ...prev,
          participationApplications: updatedApplications,
        };
      });

      setMessage(`Application status updated to ${nextStatus}.`);
    } catch (err) {
      setError(err.message || 'Unable to update application status.');
    } finally {
      setReviewingKey('');
    }
  };

  return (
    <>
      {/* Header Section */}
      <section className="mb-8 bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Events & Chill Sessions</h1>
            <p className="text-gray-600 text-lg">Create, edit, and manage events from one clean dashboard.</p>
          </div>
          <Button 
            onClick={openAddModal} 
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Add Event
          </Button>
        </div>
      </section>

      {/* Messages */}
      {message ? <div className="max-w-6xl mx-auto mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{message}</div> : null}
      {error ? <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div> : null}

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 p-8">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No events yet</h3>
            <p className="text-gray-600">Click "Add Event" to create your first event.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Applicants</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sortedItems.map((item) => {
                    const applicantCount = Array.isArray(item.participationApplications)
                      ? item.participationApplications.length
                      : 0;

return (
  <tr key={item._id} className="hover:bg-gray-50/70 transition-colors">
    <td className="px-4 py-3">
      <div className="h-12 w-16 rounded-md bg-gray-100 overflow-hidden border border-gray-200">
        {resolveImageUrl(item.image) ? (
          <img
            src={resolveImageUrl(item.image)}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <ImageIcon size={16} />
          </div>
        )}
      </div>
    </td>

    <td className="px-4 py-3">
      <p className="text-sm font-semibold text-gray-800 max-w-[240px] truncate">
        {item.title}
      </p>
    </td>

    <td className="px-4 py-3">
      <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
        {getEventTypeLabel(item.eventType)}
      </span>
    </td>

    <td className="px-4 py-3">
      <div className="inline-flex items-center gap-1.5 text-sm text-gray-700">
        <CalendarDays size={14} className="text-green-600" />
        <span>{formatCardDate(item.date)}</span>
      </div>
    </td>

    <td className="px-4 py-3">
      <div className="inline-flex items-center gap-1.5 text-sm text-gray-700">
        <Clock3 size={14} className="text-green-600" />
        <span>{formatCardTime(item)}</span>
      </div>
    </td>

    <td className="px-4 py-3">
      <div className="inline-flex items-center gap-1.5 text-sm text-gray-700 max-w-[220px]">
        <MapPin size={14} className="text-green-600 shrink-0" />
        <span className="truncate">{item.location || 'TBA'}</span>
      </div>
    </td>

    <td className="px-4 py-3 text-sm text-gray-700">
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
        {applicantCount}
      </span>
    </td>

    <td className="px-4 py-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => openEditModal(item)}
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 px-3 rounded-lg"
        >
          <Pencil size={14} />
        </Button>

        <Button
          size="sm"
          onClick={() => handleDelete(item._id)}
          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-2 px-3 rounded-lg"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </td>
  </tr>
);
          </div>
        )}

        {!loading && sortedItems.length > 0 && (
          <section className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Participation Applicants</h2>
              <p className="text-sm text-gray-600 mt-1">
                Applicant details in a separate section below event cards.
              </p>
            </div>

{applicantCards.length > 0 ? (
  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Applicant</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Event</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Applied</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Responses</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {applicantCards.map((card, index) => {
            const { eventId, eventTitle, entry } = card;
            const student = entry.student && typeof entry.student === 'object'
              ? entry.student
              : null;
            const submittedAnswers = Array.isArray(entry.application?.answers)
              ? entry.application.answers
              : [];
            const statusMeta = getApplicationStatusMeta(entry.status);
            const approveKey = `${entry._id}:approved`;
            const rejectKey = `${entry._id}:rejected`;

            return (
              <tr key={`${entry._id || entry.option}-${index}`} className="hover:bg-gray-50/70 transition-colors align-top">
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-5">
                      {student?.fullName || entry.application?.fullName || 'Student'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {entry.application?.studentId || student?.idNumber || 'ID Not provided'}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-700 max-w-[220px] truncate">{eventTitle || 'Event'}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-700">
                    {optionLabelMap[entry.option] || entry.option}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700 space-y-1">
                  <p className="truncate max-w-[220px]"><strong>Email:</strong> {student?.email || entry.application?.email || 'No email provided'}</p>
                  <p><strong>Phone:</strong> {entry.application?.phone || 'Not provided'}</p>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  {new Date(entry.appliedAt).toLocaleDateString('en-GB')}
                </td>
                <td className="px-4 py-4 min-w-[260px]">
                  {submittedAnswers.length > 0 ? (
                    <div className="space-y-2">
                      {submittedAnswers.slice(0, 2).map((answer, answerIndex) => (
                        <div key={`${answer.questionKey}-${answerIndex}`} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold text-gray-700 mb-0.5 line-clamp-1">{answer.label}</p>
                          <p className="text-[11px] text-gray-600 line-clamp-2">{answer.answer}</p>
                        </div>
                      ))}
                      {submittedAnswers.length > 2 ? (
                        <p className="text-[10px] text-gray-500">+{submittedAnswers.length - 2} more responses</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <p className="text-[11px] font-semibold text-gray-700 mb-0.5">Notes</p>
                      <p className="text-[11px] text-gray-600 line-clamp-2">{entry.application?.notes || 'Not provided'}</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold py-1 px-2 rounded transition-all"
                      onClick={() =>
                        handleApplicationStatusUpdate(eventId, entry._id, 'approved')
                      }
                      disabled={reviewingKey === approveKey}
                    >
                      {reviewingKey === approveKey ? 'Updating...' : 'Approve'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold py-1 px-2 rounded transition-all"
                      onClick={() =>
                        handleApplicationStatusUpdate(eventId, entry._id, 'rejected')
                      }
                      disabled={reviewingKey === rejectKey}
                    >
                      {reviewingKey === rejectKey ? 'Updating...' : 'Reject'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
) : (
  <p className="text-gray-500 text-sm bg-white p-4 rounded-lg border border-gray-200">
    No participation applicants yet.
  </p>
)}
</section>
)}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl my-8" onClick={(event) => event.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-0">{editingItem ? 'Edit Event' : 'Add Event'}</h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2">Event Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={form.title} 
                  onChange={handleFormChange} 
                  required 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
</div>

{/* Event Type */}
<div>
  <Label htmlFor="eventType" className="text-sm font-semibold text-gray-700 mb-2">Type</Label>
  <select
    id="eventType"
    name="eventType"
    value={form.eventType}
    onChange={handleFormChange}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
  >
    {EVENT_TYPE_OPTIONS.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
</div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-700 mb-2">Event Date</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    value={form.date} 
                    onChange={handleFormChange} 
                    required 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="time" className="text-sm font-semibold text-gray-700 mb-2">Event Time</Label>
                  <Input 
                    id="time" 
                    name="time" 
                    type="time" 
                    value={form.time} 
                    onChange={handleFormChange} 
                    required 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
<Label htmlFor="location" className="text-sm font-semibold text-gray-700 mb-2">Event Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={form.location} 
                  onChange={handleFormChange} 
                  required 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2">Short Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image" className="text-sm font-semibold text-gray-700 mb-2">Event Image URL</Label>
                <Input 
                  id="image" 
                  name="image" 
                  type="url" 
                  value={form.image} 
                  onChange={handleFormChange} 
                  placeholder="https://example.com/event-banner.jpg"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Use a public image URL so the banner loads on any device or laptop.
                </p>
                {resolveImageUrl(form.image) ? (
                  <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={resolveImageUrl(form.image)}
                      alt="Event preview"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>

              {/* Participation Options */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block uppercase tracking-wide">Participation Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PARTICIPATION_OPTIONS.map((option) => {
                    const checked = form.participationOptions.includes(option.value);
                    return (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all" style={{borderColor: checked ? '#22c55e' : '#e5e7eb', backgroundColor: checked ? '#f0fdf4' : 'transparent'}}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleParticipationOptionToggle(option.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Builder */}
              {form.participationOptions.length > 0 ? (
                <div className="pt-4 border-t border-gray-100">
                  <Label className="text-sm font-semibold text-gray-700 mb-4 block uppercase tracking-wide">Application Form Builder</Label>
                  <div className="space-y-4">
                    {form.participationOptions.map((optionValue) => {
                      const optionMeta = PARTICIPATION_OPTIONS.find((option) => option.value === optionValue);
                      const selectedBaseFields = Array.isArray(form.participationBaseFields[optionValue])
                        ? form.participationBaseFields[optionValue]
                        : [];
                      const questions = Array.isArray(form.participationForms[optionValue])
                        ? form.participationForms[optionValue]
                        : [];

                      return (
                        <div key={optionValue} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
<div className="mb-3">
  <h4 className="font-semibold text-gray-800 mb-0">{optionMeta?.label || optionValue}</h4>
</div>

<p className="text-xs text-gray-500 mb-2">
  Choose which fields students will see in the participation application form.
</p>

<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
  {APPLICATION_FORM_FIELDS.map((field) => {
    const checked = selectedBaseFields.includes(field.key);

    return (
      <label
        key={`${optionValue}-${field.key}`}
        className="flex items-center gap-2 text-sm bg-white p-2 rounded border border-gray-200"
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => handleBaseFieldToggle(optionValue, field.key)}
          className="w-4 h-4"
        />
        <span>{field.label}</span>
      </label>
    );
  })}
</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button 
                  type="button" 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition-all"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isViewOpen && selectedItem ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsViewOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl my-8" onClick={(event) => event.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-0">Event Details</h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
                onClick={() => setIsViewOpen(false)}
              >
                <X />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(100vh-120px)] p-6 space-y-6">
              {/* Event Image */}
              {resolveImageUrl(selectedItem.image) ? (
                <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={resolveImageUrl(selectedItem.image)} 
                    alt={selectedItem.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}
{/* Event Info */}
<div>
  <h3 className="text-2xl font-bold text-gray-800 mb-4">{selectedItem.title}</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
    <div>
      <span className="text-xs font-semibold text-gray-500 uppercase">Date</span>
      <p className="text-gray-700 font-medium">{formatCardDate(selectedItem.date)}</p>
    </div>
    <div>
      <span className="text-xs font-semibold text-gray-500 uppercase">Time</span>
      <p className="text-gray-700 font-medium">{formatCardTime(selectedItem)}</p>
    </div>
    <div>
      <span className="text-xs font-semibold text-gray-500 uppercase">Location</span>
      <p className="text-gray-700 font-medium">{selectedItem.location || 'TBA'}</p>
    </div>
  </div>
</div>

{/* Description */}
<div>
  <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h4>
  <p className="text-gray-600">{selectedItem.description || 'No description provided.'}</p>
</div>

{/* Participation Applications */}
<div className="border-t border-gray-100 pt-6">
  <h4 className="text-lg font-semibold text-gray-800 mb-4">Participation Applications</h4>

  {Array.isArray(selectedItem.participationApplications) && selectedItem.participationApplications.length > 0 ? (
    <div className="space-y-4">
      {[...selectedItem.participationApplications]
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        .map((entry, index) => {
          const student = entry.student && typeof entry.student === 'object'
            ? entry.student
            : null;
          const submittedAnswers = Array.isArray(entry.application?.answers)
            ? entry.application.answers
            : [];
          const statusMeta = getApplicationStatusMeta(entry.status);
          const approveKey = `${entry._id}:approved`;
          const rejectKey = `${entry._id}:rejected`;

          return (
            <div key={`${entry._id || entry.option}-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors">
              {/* Application Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">
                    {student?.fullName || entry.application?.fullName || 'Student'}
                  </p>
                  <p className="text-xs text-gray-500">{student?.idNumber || 'ID Not provided'}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  {optionLabelMap[entry.option] || entry.option}
                </span>
              </div>

              {/* Status and Actions */}
              <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-default ${statusMeta.className}`}
                  disabled
                >
                  {statusMeta.label}
                </button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1 px-3 rounded transition-all"
                  onClick={() =>
                    handleApplicationStatusUpdate(selectedItem._id, entry._id, 'approved')
                  }
                  disabled={reviewingKey === approveKey}
                >
                  {reviewingKey === approveKey ? 'Updating...' : 'Approve'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 px-3 rounded transition-all"
                  onClick={() =>
                    handleApplicationStatusUpdate(selectedItem._id, entry._id, 'rejected')
                  }
                  disabled={reviewingKey === rejectKey}
                >
                  {reviewingKey === rejectKey ? 'Updating...' : 'Reject'}
                </Button>
              </div>

              {/* Contact Info */}
              <div className="text-sm text-gray-600 mb-3 space-y-1">
                <p className="mb-0"><strong>Email:</strong> {student?.email || entry.application?.email || 'No email provided'}</p>
                <p className="mb-0"><strong>Applied:</strong> {new Date(entry.appliedAt).toLocaleString('en-GB')}</p>
              </div>

              {/* Application Answers */}
              {submittedAnswers.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {submittedAnswers.map((answer, answerIndex) => (
                    <div key={`${answer.questionKey}-${answerIndex}`}>
                      <p className="text-xs font-semibold text-gray-700 mb-1">{answer.label}</p>
                      <p className="text-xs text-gray-600">{answer.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Phone</p>
                    <p className="text-xs text-gray-600">{entry.application?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Notes</p>
                    <p className="text-xs text-gray-600">{entry.application?.notes || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  ) : (
    <p className="text-gray-500 text-sm bg-white p-4 rounded-lg border border-gray-200">
      No participation applications yet.
    </p>
  )}
</div>
              </div>
            </div>
          </div>
      ) : null}
    </>
  );
}
