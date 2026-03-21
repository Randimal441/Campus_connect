import { api } from './api';

export const getUpcomingEvents = () => api('/events/upcoming');

export const getMyEventApplications = () => api('/events/my-applications');

export const applyForParticipation = (eventId, payload) =>
	api(`/events/${eventId}/apply-participation`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
