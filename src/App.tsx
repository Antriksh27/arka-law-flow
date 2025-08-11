import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DialogProvider } from './hooks/use-dialog';
import RoleBasedRouter from './components/routing/RoleBasedRouter';
import Auth from './pages/Auth';
import { BookingPage } from './pages/BookingPage';
import { Toaster } from './components/ui/toaster';
import { BookRedirect } from './pages/BookRedirect';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
const BUILD_INFO = new Date().toISOString();
console.log('App build:', BUILD_INFO);
function App() {
  return (
    <div className="min-h-screen bg-gray-50" data-build={BUILD_INFO}>
      <Router>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DialogProvider>
              <Routes>
                {/* Public booking routes - no authentication required */}
                <Route path="/b/:code" element={<BookRedirect />} />
                <Route path="/bk/:compact" element={<BookRedirect />} />
                <Route path="/book/:lawyerId" element={<BookingPage />} />
                
                {/* Auth route */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected routes with role-based routing */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <RoleBasedRouter />
                  </ProtectedRoute>
                } />
              </Routes>
              <Toaster />
            </DialogProvider>
          </AuthProvider>
        </QueryClientProvider>
      </Router>
    </div>
  );
}

export default App;
