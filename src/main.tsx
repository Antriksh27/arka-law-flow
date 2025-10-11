import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import '@cometchat/uikit-elements'
import { applyCSPMetaTag } from './lib/contentSecurityPolicy'

// Apply Content Security Policy for XSS protection
applyCSPMetaTag();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
