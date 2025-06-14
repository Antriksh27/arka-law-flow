
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DialogProvider } from './hooks/use-dialog';
import DashboardLayout from './components/layout/DashboardLayout';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Clients from './pages/Clients';
import ClientInfo from './pages/ClientInfo';
import Appointments from './pages/Appointments';
import Tasks from './pages/Tasks';
import Hearings from './pages/Hearings';
import Documents from './pages/Documents';
import Notes from './pages/Notes';
import Messages from './pages/Messages';
import Invoices from './pages/Invoices';
import Team from './pages/Team';
import NotFound from './pages/NotFound';
import { BookingPage } from './pages/BookingPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DialogProvider>
              <Routes>
                {/* Public booking route - no authentication required */}
                <Route path="/book/:lawyerId" element={<BookingPage />} />
                
                {/* Auth route */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected routes with dashboard layout */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/cases" element={<Cases />} />
                        <Route path="/cases/:id" element={<CaseDetail />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/clients/:id" element={<ClientInfo />} />
                        <Route path="/appointments" element={<Appointments />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/hearings" element={<Hearings />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/notes" element={<Notes />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
              </Routes>
            </DialogProvider>
          </AuthProvider>
        </QueryClientProvider>
      </Router>
    </div>
  );
}

export default App;
