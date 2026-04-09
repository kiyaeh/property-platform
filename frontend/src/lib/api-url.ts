const PROD_API_FALLBACK = 'https://property-platform-3.onrender.com';

const trimmedEnvUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

export const API_URL =
  trimmedEnvUrl ??
  (process.env.NODE_ENV === 'production'
    ? PROD_API_FALLBACK
    : 'http://localhost:4000');
