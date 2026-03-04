import { api } from './api';

export const getUpcomingEvents = () => api('/events/upcoming');
