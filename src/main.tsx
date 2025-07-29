import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applyCSPMetaTag } from './lib/contentSecurityPolicy'

// Apply Content Security Policy for XSS protection
applyCSPMetaTag();

createRoot(document.getElementById("root")!).render(<App />);
