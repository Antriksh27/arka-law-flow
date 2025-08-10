// Centralized public URL configuration for shareable links
// Set PUBLIC_BASE_URL to your main domain (e.g., 'https://yourdomain.com')
// Keep 'auto' to fall back to the current origin during development.
export const PUBLIC_BASE_URL = 'auto';

export const getPublicBaseUrl = (): string => {
  return PUBLIC_BASE_URL !== 'auto' ? PUBLIC_BASE_URL : window.location.origin;
};
