import { api } from './api';

export const getUpcomingEvents = () => api('/events/upcoming');

export const getMyEventApplications = () => api('/events/my-applications');

export const askAboutEvents = (payload) =>
	api('/events/ask', {
		method: 'POST',
		body: JSON.stringify(payload),
	});

export const applyForParticipation = (eventId, payload) =>
	api(`/events/${eventId}/apply-participation`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});

export const updateParticipationApplication = (eventId, applicationId, payload) =>
	api(`/events/${eventId}/applications/${applicationId}`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	});

export const removeParticipationApplication = (eventId, applicationId) =>
	api(`/events/${eventId}/applications/${applicationId}`, {
		method: 'DELETE',
	});
