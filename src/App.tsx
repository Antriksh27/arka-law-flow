import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, lazy, Suspense } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ClientProtectedRoute } from './components/auth/ClientProtectedRoute';
import { DialogProvider } from './hooks/use-dialog';
import RoleBasedRouter from './components/routing/RoleBasedRouter';
import Auth from './pages/Auth';
import ClientAuth from './pages/ClientAuth';
import { BookingPage } from './pages/BookingPage';
import { LawyerSelection } from './pages/LawyerSelection';
import { Toaster } from './components/ui/toaster';
import { BookRedirect } from './pages/BookRedirect';
import { ClientLayout } from './layouts/ClientLayout';
import { ClientAuthProvider } from './contexts/ClientAuthContext';

// Lazy load heavy components for better performance
const CaseDetailEnhanced = lazy(() => import('./pages/CaseDetailEnhanced'));
const Cases = lazy(() => import('./pages/Cases'));
const Hearings = lazy(() => import('./pages/Hearings'));
const Documents = lazy(() => import('./pages/Documents'));
const Clients = lazy(() => import('./pages/Clients'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Notes = lazy(() => import('./pages/Notes'));
const Team = lazy(() => import('./pages/Team'));
const NotificationDashboard = lazy(() => import('./components/notifications/NotificationDashboard'));
const DailyBoard = lazy(() => import('./pages/DailyBoard'));
const CauseList = lazy(() => import('./pages/CauseList'));

// Client portal components
const ClientCases = lazy(() => import('./pages/client-portal/ClientCases'));
const ClientCaseDetail = lazy(() => import('./pages/client-portal/ClientCaseDetail'));

import { defaultQueryConfig } from './lib/queryConfig';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './integrations/supabase/client';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';
import { ConnectionStatus } from './components/ConnectionStatus';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...defaultQueryConfig,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  },
});

// Prefetch common queries for better performance
const prefetchCommonQueries = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Prefetch cases list (frequently accessed)
  queryClient.prefetchQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cases')
        .select('id, case_title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      return data;
    },
  });

  // Prefetch team members (rarely changes)
  queryClient.prefetchQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data } = await supabase
        .from('team_members')
        .select('user_id, full_name, role')
        .limit(50);
      return data;
    },
  });
};

const BUILD_INFO = new Date().toISOString();
console.log('App build:', BUILD_INFO);

// Inner component that uses React Query hooks
function AppRoutes() {
  const { user } = useAuth();

  // Initialize real-time notifications (inside QueryClientProvider)
  useRealtimeNotifications();

  useEffect(() => {
    // Prefetch when user logs in
    if (user) {
      prefetchCommonQueries();
    }
  }, [user]);

  return (
    <DialogProvider>
              <ConnectionStatus />
              <Routes>
              {/* Public booking routes - completely public, no authentication */}
              <Route path="/b/:code" element={<BookRedirect />} />
              <Route path="/bk/:compact" element={<BookRedirect />} />
              <Route path="/book/:lawyerId" element={<BookingPage />} />
              <Route path="/book" element={<LawyerSelection />} />
              
              {/* Client Portal Routes - wrapped with ClientAuthProvider */}
              <Route path="/client/*" element={
                <ClientAuthProvider>
                  <Routes>
                    <Route path="/" element={<ClientAuth />} />
                    <Route path="/cases" element={
                      <ClientProtectedRoute>
                        <ClientLayout>
                          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                            <ClientCases />
                          </Suspense>
                        </ClientLayout>
                      </ClientProtectedRoute>
                    } />
                    <Route path="/cases/:id" element={
                      <ClientProtectedRoute>
                        <ClientLayout>
                          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                            <ClientCaseDetail />
                          </Suspense>
                        </ClientLayout>
                      </ClientProtectedRoute>
                    } />
                  </Routes>
                </ClientAuthProvider>
              } />
              
              {/* Auth route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Enhanced case details route */}
              <Route path="/cases/:id/legalkart-details" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <CaseDetailEnhanced />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Notification Dashboard */}
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <NotificationDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Daily Board */}
              <Route path="/daily-board" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <DailyBoard />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Cause List */}
              <Route path="/cause-list" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <CauseList />
                  </Suspense>
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
            <ReactQueryDevtools initialIsOpen={false} />
          </DialogProvider>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50" data-build={BUILD_INFO}>
      <Router>
        <QueryClientProvider client={queryClient}>
          <AppRoutes />
        </QueryClientProvider>
      </Router>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
