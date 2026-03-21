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
  date: '',
  time: '',
  location: '',
  description: '',
  image: '',
  participationOptions: [],
  participationForms: {},
};

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
  const [imageFile, setImageFile] = useState(null);
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
    setImageFile(null);
    setMessage('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    const mappedForms = {};

    if (Array.isArray(item.participationForms)) {
      item.participationForms.forEach((formItem) => {
        mappedForms[formItem.option] = Array.isArray(formItem.questions)
          ? formItem.questions.map((question) => ({
              label: question.label || '',
              required: question.required !== false,
            }))
          : [];
      });
    }

    setEditingItem(item);
    setForm({
      title: item.title || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      time: item.time || '',
      location: item.location || '',
      description: item.description || '',
      image: item.image || '',
      participationOptions: Array.isArray(item.participationOptions)
        ? item.participationOptions
        : [],
      participationForms: mappedForms,
    });
    setImageFile(null);
    setMessage('');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setImageFile(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleParticipationOptionToggle = (optionValue) => {
    setForm((prev) => {
      const exists = prev.participationOptions.includes(optionValue);

      const nextParticipationForms = { ...prev.participationForms };
      if (exists) {
        delete nextParticipationForms[optionValue];
      } else {
        nextParticipationForms[optionValue] = [{ label: '', required: true }];
      }

      return {
        ...prev,
        participationOptions: exists
          ? prev.participationOptions.filter((value) => value !== optionValue)
          : [...prev.participationOptions, optionValue],
        participationForms: nextParticipationForms,
      };
    });
  };

  const handleAddQuestion = (optionValue) => {
    setForm((prev) => {
      const existing = Array.isArray(prev.participationForms[optionValue])
        ? prev.participationForms[optionValue]
        : [];

      return {
        ...prev,
        participationForms: {
          ...prev.participationForms,
          [optionValue]: [...existing, { label: '', required: true }],
        },
      };
    });
  };

  const handleQuestionChange = (optionValue, index, field, value) => {
    setForm((prev) => {
      const existing = Array.isArray(prev.participationForms[optionValue])
        ? prev.participationForms[optionValue]
        : [];

      const updatedQuestions = existing.map((question, questionIndex) => {
        if (questionIndex !== index) return question;
        return {
          ...question,
          [field]: value,
        };
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

  const handleRemoveQuestion = (optionValue, index) => {
    setForm((prev) => {
      const existing = Array.isArray(prev.participationForms[optionValue])
        ? prev.participationForms[optionValue]
        : [];

      const updatedQuestions = existing.filter((_, questionIndex) => questionIndex !== index);

      return {
        ...prev,
        participationForms: {
          ...prev.participationForms,
          [optionValue]: updatedQuestions,
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
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('date', form.date);
      payload.append('time', form.time);
      payload.append('location', form.location);
      payload.append('description', form.description);
      payload.append('eventType', 'event');
      payload.append('image', form.image || '');
      form.participationOptions.forEach((option) => {
        payload.append('participationOptions', option);
      });

      const participationFormsPayload = form.participationOptions.map((option) => {
        const questions = Array.isArray(form.participationForms[option])
          ? form.participationForms[option]
          : [];

        return {
          option,
          questions: questions
            .map((question, index) => ({
              key: `q_${index + 1}`,
              label: (question.label || '').trim(),
              required: question.required !== false,
            }))
            .filter((question) => question.label),
        };
      });

      payload.append('participationForms', JSON.stringify(participationFormsPayload));

      if (imageFile) {
        payload.append('imageFile', imageFile);
      }

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
      <section className="admin-events-header">
        <div>
          <h1 className="!text-white !mb-2">Events & Chill Sessions</h1>
          <p className="admin-events-header-subtitle mb-0">
            Create, edit, and manage events from one clean dashboard.
          </p>
        </div>
        <Button onClick={openAddModal} className="admin-events-add-btn">
          <Plus size={18} />
          Add Event
        </Button>
      </section>

      {message ? <p className="admin-events-success">{message}</p> : null}
      {error ? <p className="admin-events-error">{error}</p> : null}

      {loading ? (
        <p>Loading events...</p>
      ) : sortedItems.length === 0 ? (
        <div className="admin-events-empty">
          <h3>No events yet</h3>
          <p>Click Add Event to create your first event card.</p>
        </div>
      ) : (
        <div className="admin-events-grid">
          {sortedItems.map((item) => (
            <article key={item._id} className="admin-event-card">
              <div className="admin-event-image-wrap">
                {resolveImageUrl(item.image) ? (
                  <img src={resolveImageUrl(item.image)} alt={item.title} className="admin-event-image" />
                ) : (
                  <div className="admin-event-image-placeholder">
                    <ImageIcon size={28} />
                    <span>No Image</span>
                  </div>
                )}
              </div>

              <div className="admin-event-body">
                <h3 className="admin-event-title">{item.title}</h3>

                <div className="admin-event-meta-row">
                  <p className="mb-0"><CalendarDays size={14} /> {formatCardDate(item.date)}</p>
                  <p className="mb-0"><Clock3 size={14} /> {formatCardTime(item)}</p>
                </div>

                <p className="admin-event-location mb-0">
                  <MapPin size={14} /> {item.location || 'TBA'}
                </p>

                <div className="admin-event-actions">
                  <Button size="sm" onClick={() => openDetails(item)} className="admin-event-view-btn">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item._id)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="admin-events-modal-backdrop" onClick={closeModal}>
          <div className="admin-events-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-events-modal-header">
              <h3 className="mb-0">{editingItem ? 'Edit Event' : 'Add Event'}</h3>
              <button type="button" className="admin-events-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="admin-events-form">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" name="title" value={form.title} onChange={handleFormChange} required />
              </div>

              <div className="admin-events-form-grid">
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date</Label>
                  <Input id="date" name="date" type="date" value={form.date} onChange={handleFormChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Event Time</Label>
                  <Input id="time" name="time" type="time" value={form.time} onChange={handleFormChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Event Location</Label>
                <Input id="location" name="location" value={form.location} onChange={handleFormChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="admin-events-textarea"
                  value={form.description}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageFile">Event Image Upload</Label>
                <Input id="imageFile" name="imageFile" type="file" accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="space-y-2">
                <Label>Participation Types (Students can apply)</Label>
                <div className="admin-events-options-grid">
                  {PARTICIPATION_OPTIONS.map((option) => {
                    const checked = form.participationOptions.includes(option.value);
                    return (
                      <label key={option.value} className="admin-events-option-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleParticipationOptionToggle(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {form.participationOptions.length > 0 ? (
                <div className="space-y-2">
                  <Label>Application Form Builder (Per Participation Type)</Label>
                  <div className="admin-events-form-builder-stack">
                    {form.participationOptions.map((optionValue) => {
                      const optionMeta = PARTICIPATION_OPTIONS.find((option) => option.value === optionValue);
                      const questions = Array.isArray(form.participationForms[optionValue])
                        ? form.participationForms[optionValue]
                        : [];

                      return (
                        <div key={optionValue} className="admin-events-form-builder-card">
                          <div className="admin-events-form-builder-header">
                            <h4 className="mb-0">{optionMeta?.label || optionValue}</h4>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleAddQuestion(optionValue)}>
                              Add Question
                            </Button>
                          </div>

                          {questions.length === 0 ? (
                            <p className="admin-events-form-builder-empty mb-0">
                              No questions yet. Add questions students should answer for this role.
                            </p>
                          ) : (
                            <div className="admin-events-form-builder-list">
                              {questions.map((question, questionIndex) => (
                                <div key={`${optionValue}-${questionIndex}`} className="admin-events-form-question-row">
                                  <Input
                                    value={question.label}
                                    onChange={(event) =>
                                      handleQuestionChange(optionValue, questionIndex, 'label', event.target.value)
                                    }
                                    placeholder="Question label"
                                  />
                                  <label className="admin-events-form-question-required">
                                    <input
                                      type="checkbox"
                                      checked={question.required !== false}
                                      onChange={(event) =>
                                        handleQuestionChange(optionValue, questionIndex, 'required', event.target.checked)
                                      }
                                    />
                                    <span>Required</span>
                                  </label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveQuestion(optionValue, questionIndex)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="admin-events-form-actions">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Update Event' : 'Create Event'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isViewOpen && selectedItem ? (
        <div className="admin-events-modal-backdrop" onClick={() => setIsViewOpen(false)}>
          <div className="admin-events-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-events-modal-header">
              <h3 className="mb-0">Event Details</h3>
              <button type="button" className="admin-events-close-btn" onClick={() => setIsViewOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {resolveImageUrl(selectedItem.image) ? (
                <img src={resolveImageUrl(selectedItem.image)} alt={selectedItem.title} className="admin-event-image details" />
              ) : null}
              <h3 className="mb-1">{selectedItem.title}</h3>
              <p className="mb-0"><strong>Date:</strong> {formatCardDate(selectedItem.date)}</p>
              <p className="mb-0"><strong>Time:</strong> {formatCardTime(selectedItem)}</p>
              <p className="mb-0"><strong>Location:</strong> {selectedItem.location || 'TBA'}</p>
              <p className="mb-0 text-muted-foreground">{selectedItem.description || 'No description provided.'}</p>

              <div className="admin-event-applications-wrap">
                <h4 className="mb-1">Participation Applications</h4>

                {Array.isArray(selectedItem.participationApplications) && selectedItem.participationApplications.length > 0 ? (
                  <div className="admin-event-applications-list">
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
                          <div key={`${entry._id || entry.option}-${index}`} className="admin-event-application-item">
                            <div className="admin-event-application-head">
                              <p className="mb-0">
                                <strong>{student?.fullName || entry.application?.fullName || 'Student'}</strong>
                              </p>
                              <span className="admin-event-application-badge">
                                {optionLabelMap[entry.option] || entry.option}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
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
                                className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
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
                                className="!bg-red-600 hover:!bg-red-700 !text-white"
                                onClick={() =>
                                  handleApplicationStatusUpdate(selectedItem._id, entry._id, 'rejected')
                                }
                                disabled={reviewingKey === rejectKey}
                              >
                                {reviewingKey === rejectKey ? 'Updating...' : 'Reject'}
                              </Button>
                            </div>

                            <p className="mb-0 text-sm text-muted-foreground">
                              {student?.email || entry.application?.email || 'No email provided'}
                            </p>
                            <p className="mb-0 text-sm text-muted-foreground">
                              Applied on {new Date(entry.appliedAt).toLocaleString('en-GB')}
                            </p>

                            {submittedAnswers.length > 0 ? (
                              <div className="admin-event-application-answers">
                                {submittedAnswers.map((answer, answerIndex) => (
                                  <div key={`${answer.questionKey}-${answerIndex}`} className="admin-event-application-answer">
                                    <p className="mb-0"><strong>{answer.label}</strong></p>
                                    <p className="mb-0">{answer.answer}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="admin-event-application-answers">
                                <div className="admin-event-application-answer">
                                  <p className="mb-0"><strong>Phone</strong></p>
                                  <p className="mb-0">{entry.application?.phone || 'Not provided'}</p>
                                </div>
                                <div className="admin-event-application-answer">
                                  <p className="mb-0"><strong>Notes</strong></p>
                                  <p className="mb-0">{entry.application?.notes || 'Not provided'}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="mb-0 text-muted-foreground">No participation applications submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
