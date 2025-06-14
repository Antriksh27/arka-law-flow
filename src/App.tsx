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
import Invoices from './pages/Invoices';
import Messages from './pages/Messages';
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
                
                {/* Existing authenticated routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Index />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/cases" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Cases />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/cases/:id" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <CaseDetail />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Clients />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clients/:id" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ClientInfo />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/appointments" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Appointments />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Tasks />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/hearings" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Hearings />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/documents" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Documents />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/notes" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Notes />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/invoices" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Invoices />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Messages />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/team" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Team />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DialogProvider>
          </AuthProvider>
        </QueryClientProvider>
      </Router>
    </div>
  );
}

export default App;
