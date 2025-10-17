/**
 * Content Security Policy configuration for enhanced XSS protection
 */

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite dev mode
    "https://hpcnipcbymruvsnqrmjx.supabase.co",
    "https://*.supabase.co"
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
    "https://fonts.googleapis.com"
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com"
  ],
  'img-src': [
    "'self'",
    "data:",
    "blob:",
    "https://hpcnipcbymruvsnqrmjx.supabase.co",
    "https://*.supabase.co",
    "https://*.cometchat.io"
  ],
  'connect-src': [
    "'self'",
    "https://hpcnipcbymruvsnqrmjx.supabase.co",
    "https://*.supabase.co",
    "wss://hpcnipcbymruvsnqrmjx.supabase.co",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com",
    "https://*.cometchat.io",
    "wss://*.cometchat.io",
    // Stream Chat (WebSocket + REST)
    "https://*.stream-io-api.com",
    "wss://*.stream-io-api.com",
    // Novu In-App Inbox API
    "https://api.novu.co"
  ],
  'object-src': ["'none'"],
  'frame-src': ["'self'", 'blob:', 'data:', 'https:'],
  'child-src': ["'self'", 'blob:', 'data:', 'https:'],
  'base-uri': ["'self'"],
  'frame-ancestors': ["'none'"]
};

/**
 * Generate CSP header value
 */
export const generateCSPHeader = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Apply CSP via meta tag (fallback for client-side)
 */
export const applyCSPMetaTag = (): void => {
  if (typeof document !== 'undefined') {
    let meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      document.head.appendChild(meta);
    }
    meta.content = generateCSPHeader();
  }
};

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};