export const ROLES = {
  STUDENT: 'student',
  COACH: 'coach',
  RESOURCE_COORDINATOR: 'resource_coordinator',
  CONSULTANT: 'consultant',
  EVENT_COORDINATOR: 'event_coordinator',
  SUPER_ADMIN: 'super_admin',
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student (User for all sections)',
  [ROLES.COACH]: 'Coach (Clubs & Sports Admin)',
  [ROLES.RESOURCE_COORDINATOR]: 'Resource Coordinator (Resource Sharing Admin)',
  [ROLES.CONSULTANT]: 'Consultant (Consulting Admin)',
  [ROLES.EVENT_COORDINATOR]: 'Event Coordinator (Events & Chill Sessions Admin)',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
};

export const SECTIONS = [
  { id: 'clubs-sports', label: 'Clubs & Sports', path: '/user/clubs-sports' },
  { id: 'resource-sharing', label: 'Resource Sharing', path: '/user/resource-sharing' },
  { id: 'consulting', label: 'Consulting', path: '/user/consulting' },
  { id: 'events-chill', label: 'Events', path: '/user/events-chill' },
];
