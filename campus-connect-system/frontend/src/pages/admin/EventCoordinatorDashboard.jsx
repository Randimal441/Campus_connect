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
  eventType: 'event',
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
      eventType: item.eventType || 'event',
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
      payload.append('eventType', form.eventType || 'event');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => (
              <article 
                key={item._id} 
                className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="w-full h-48 bg-gray-100 overflow-hidden">
                  {resolveImageUrl(item.image) ? (
                    <img 
                      src={resolveImageUrl(item.image)} 
                      alt={item.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                      <ImageIcon size={32} />
                      <span className="text-sm mt-2">No Image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">{item.title}</h3>

                  <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 mb-3">
                    {item.eventType === 'chill_session' ? 'Chill Session' : 'Event'}
                  </span>

                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center text-sm text-gray-600 gap-2">
                      <CalendarDays size={16} className="text-green-600" />
                      <span>{formatCardDate(item.date)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 gap-2">
                      <Clock3 size={16} className="text-green-600" />
                      <span>{formatCardTime(item)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 gap-2">
                      <MapPin size={16} className="text-green-600" />
                      <span>{item.location || 'TBA'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => openDetails(item)} 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg transition-all"
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openEditModal(item)}
                      className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 rounded-lg transition-all"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDelete(item._id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-2 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
                  <option value="event">Event</option>
                  <option value="chill_session">Chill Session</option>
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
                <Label htmlFor="location" className="text-sm font-semibold text-gray-700 mb-2">Location</Label>
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
                <Label htmlFor="imageFile" className="text-sm font-semibold text-gray-700 mb-2">Event Image</Label>
                <Input 
                  id="imageFile" 
                  name="imageFile" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="w-full"
                />
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
                      const questions = Array.isArray(form.participationForms[optionValue])
                        ? form.participationForms[optionValue]
                        : [];

                      return (
                        <div key={optionValue} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-800 mb-0">{optionMeta?.label || optionValue}</h4>
                            <Button 
                              type="button" 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-3 rounded"
                              onClick={() => handleAddQuestion(optionValue)}
                            >
                              Add Question
                            </Button>
                          </div>

                          {questions.length === 0 ? (
                            <p className="text-sm text-gray-500 mb-0">No questions yet. Add questions students should answer for this role.</p>
                          ) : (
                            <div className="space-y-2">
                              {questions.map((question, questionIndex) => (
                                <div key={`${optionValue}-${questionIndex}`} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-100">
                                  <Input
                                    value={question.label}
                                    onChange={(event) =>
                                      handleQuestionChange(optionValue, questionIndex, 'label', event.target.value)
                                    }
                                    placeholder="Question label"
                                    className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                                  />
                                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                    <input
                                      type="checkbox"
                                      checked={question.required !== false}
                                      onChange={(event) =>
                                        handleQuestionChange(optionValue, questionIndex, 'required', event.target.checked)
                                      }
                                      className="w-3 h-3"
                                    />
                                    <span>Required</span>
                                  </label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
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

              {/* Applications Section */}
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
                  <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">No participation applications submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
