
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
import Cases from './pages/Cases';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import CaseDetail from './pages/CaseDetail';
import Hearings from './pages/Hearings';
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
              <Route path="/" element={<Navigate to="/cases" />} />
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
    console.log('User:', user);
    console.log('Loading:', loading);
  }, [user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/cases" state={{ from: location }} replace />;
  }

  return children;
}

export default App;
