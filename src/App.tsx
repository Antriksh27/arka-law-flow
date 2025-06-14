
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Index from './pages/Index';
import Cases from './pages/Cases';
import Clients from './pages/Clients';
import ClientInfo from './pages/ClientInfo';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import CaseDetail from './pages/CaseDetail';
import Hearings from './pages/Hearings';
import Notes from './pages/Notes';
import Appointments from './pages/Appointments';
import Invoices from './pages/Invoices';
import Messages from './pages/Messages';
import Auth from './pages/Auth';
import { Toaster } from "@/components/ui/sonner"

// Import DialogProvider
import { DialogProvider } from './hooks/use-dialog';

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DialogProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Index />
                  </RequireAuth>
                }
              />
              <Route
                path="/cases"
                element={
                  <RequireAuth>
                    <Cases />
                  </RequireAuth>
                }
              />
              <Route
                path="/cases/:caseId"
                element={
                  <RequireAuth>
                    <CaseDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/clients"
                element={
                  <RequireAuth>
                    <Clients />
                  </RequireAuth>
                }
              />
              <Route
                path="/clients/:id"
                element={
                  <RequireAuth>
                    <ClientInfo />
                  </RequireAuth>
                }
              />
              <Route
                path="/tasks"
                element={
                  <RequireAuth>
                    <Tasks />
                  </RequireAuth>
                }
              />
              <Route
                path="/hearings"
                element={
                  <RequireAuth>
                    <Hearings />
                  </RequireAuth>
                }
              />
              <Route
                path="/documents"
                element={
                  <RequireAuth>
                    <Documents />
                  </RequireAuth>
                }
              />
              <Route
                path="/notes"
                element={
                  <RequireAuth>
                    <Notes />
                  </RequireAuth>
                }
              />
              <Route
                path="/appointments"
                element={
                  <RequireAuth>
                    <Appointments />
                  </RequireAuth>
                }
              />
              <Route
                path="/invoices"
                element={
                  <RequireAuth>
                    <Invoices />
                  </RequireAuth>
                }
              />
              <Route
                path="/messages"
                element={
                  <RequireAuth>
                    <Messages />
                  </RequireAuth>
                }
              />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </DialogProvider>
    </QueryClientProvider>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('RequireAuth - User:', user);
    console.log('RequireAuth - Loading:', loading);
    console.log('RequireAuth - Location:', location.pathname);
  }, [user, loading, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-legal-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('RequireAuth - No user, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

export default App;
