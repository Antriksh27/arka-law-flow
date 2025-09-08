import { pdfjs } from 'react-pdf';

// Configure PDF.js worker for Vite with proper fallbacks
let workerSrc = '';

// Try different CDN sources for reliability
const workerSources = [
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
];

// Set up worker with fallback
for (const source of workerSources) {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = source;
    workerSrc = source;
    break;
  } catch (error) {
    console.warn(`Failed to set PDF worker from ${source}:`, error);
  }
}

if (!workerSrc) {
  console.warn('All PDF worker sources failed, PDF viewing may not work properly');
}

export { pdfjs };