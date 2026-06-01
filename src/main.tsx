import "./instrument";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import * as Sentry from "@sentry/react";
import './index.css'
import { applyCSPMetaTag } from './lib/contentSecurityPolicy'
import { AuthProvider } from './contexts/AuthContext'
import { DialogProvider } from './hooks/use-dialog'

// Apply Content Security Policy for XSS protection
applyCSPMetaTag();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong</p>} showDialog>
      <AuthProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
