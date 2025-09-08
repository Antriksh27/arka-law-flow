import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applyCSPMetaTag } from './lib/contentSecurityPolicy'
import './lib/pdfSetup' // Initialize PDF.js worker

// Apply Content Security Policy for XSS protection
applyCSPMetaTag();

createRoot(document.getElementById("root")!).render(<App />);
