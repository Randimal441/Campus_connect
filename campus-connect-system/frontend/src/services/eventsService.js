import { api } from './api';

export const getUpcomingEvents = () => api('/events/upcoming');

export const applyForParticipation = (eventId, payload) =>
	api(`/events/${eventId}/apply-participation`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
