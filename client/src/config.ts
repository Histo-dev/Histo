const fallbackBackendUrl = 'http://localhost:3000';

const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL ?? fallbackBackendUrl;

export const BACKEND_URL = configuredBackendUrl.replace(/\/$/, '');
