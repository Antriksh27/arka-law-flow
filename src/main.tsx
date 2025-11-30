import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applyCSPMetaTag } from './lib/contentSecurityPolicy'
import { AuthProvider } from './contexts/AuthContext'

// Apply Content Security Policy for XSS protection
applyCSPMetaTag();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
