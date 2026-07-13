// Centralise toutes les variables d'environnement et URLs

export const BACKEND_URL = window.location.origin;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const CLIENT_ID_42 = import.meta.env.VITE_CLIENT_ID_42 || '';
export const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/google/callback`;
export const REDIRECT_URI_42 = `${window.location.origin}/auth/42/callback`;