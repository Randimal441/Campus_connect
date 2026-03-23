import { api } from './api';

export const getAllEvents = () => api('/events');

export const createEvent = (formData) =>
  api('/events', {
    method: 'POST',
    body: formData,
  });

export const updateEvent = (id, formData) =>
  api(`/events/${id}`, {
    method: 'PUT',
    body: formData,
  });

export const deleteEvent = (id) =>
  api(`/events/${id}`, {
    method: 'DELETE',
  });

export const updateEventApplicationStatus = (eventId, applicationId, status) =>
  api(`/events/${eventId}/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: { status },
  });
