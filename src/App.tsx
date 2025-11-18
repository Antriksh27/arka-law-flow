import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, lazy, Suspense } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DialogProvider } from './hooks/use-dialog';
import RoleBasedRouter from './components/routing/RoleBasedRouter';
import Auth from './pages/Auth';
import { BookingPage } from './pages/BookingPage';
import { LawyerSelection } from './pages/LawyerSelection';
import { Toaster } from './components/ui/toaster';
import { BookRedirect } from './pages/BookRedirect';
import ZohoCallback from './pages/ZohoCallback';

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

import { defaultQueryConfig } from './lib/queryConfig';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './integrations/supabase/client';

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

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    // Prefetch when user logs in
    if (user) {
      prefetchCommonQueries();
    }
  }, [user]);

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
              
              {/* Auth route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Zoho OAuth callback */}
              <Route path="/zoho/callback" element={<ZohoCallback />} />
              
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
          </QueryClientProvider>
        </Router>
      </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
