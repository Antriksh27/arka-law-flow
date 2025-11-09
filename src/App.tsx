import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DialogProvider } from './hooks/use-dialog';
import RoleBasedRouter from './components/routing/RoleBasedRouter';
import Auth from './pages/Auth';
import { BookingPage } from './pages/BookingPage';
import { LawyerSelection } from './pages/LawyerSelection';
import { Toaster } from './components/ui/toaster';
import { BookRedirect } from './pages/BookRedirect';
import CaseDetailEnhanced from './pages/CaseDetailEnhanced';
import ChatbotDemo from './pages/ChatbotDemo';
import ZohoCallback from './pages/ZohoCallback';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  },
});
const BUILD_INFO = new Date().toISOString();
console.log('App build:', BUILD_INFO);

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50" data-build={BUILD_INFO}>
        <Router>
          <QueryClientProvider client={queryClient}>
            <DialogProvider>
              <Routes>
              {/* Public booking routes - completely public, no authentication */}
              <Route path="/b/:code" element={<BookRedirect />} />
              <Route path="/bk/:compact" element={<BookRedirect />} />
              <Route path="/book/:lawyerId" element={<BookingPage />} />
              <Route path="/book" element={<LawyerSelection />} />
              
              {/* Chatbot demo - public route */}
              <Route path="/chatbot-demo" element={<ChatbotDemo />} />
              
              {/* Auth route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Zoho OAuth callback */}
              <Route path="/zoho/callback" element={<ZohoCallback />} />
              
              {/* Enhanced case details route */}
              <Route path="/cases/:id/legalkart-details" element={
                <ProtectedRoute>
                  <CaseDetailEnhanced />
                </ProtectedRoute>
              } />
              
              {/* All other routes require authentication */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <RoleBasedRouter />
                </ProtectedRoute>
              } />
              </Routes>
              <Toaster />
            </DialogProvider>
          </QueryClientProvider>
        </Router>
      </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
