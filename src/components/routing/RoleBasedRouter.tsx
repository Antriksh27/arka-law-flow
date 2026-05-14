import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Main application pages
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';

// Lazy load heavy pages
const Contacts = lazy(() => import('@/pages/Contacts'));
const ContactInfo = lazy(() => import('@/pages/ContactInfo'));
const Cases = lazy(() => import('@/pages/Cases'));
const CaseDetailEnhanced = lazy(() => import('@/pages/CaseDetailEnhanced'));
const Clients = lazy(() => import('@/pages/Clients'));
const ClientInfo = lazy(() => import('@/pages/ClientInfo'));
const Appointments = lazy(() => import('@/pages/Appointments'));
const Tasks = lazy(() => import('@/pages/Tasks'));
const Hearings = lazy(() => import('@/pages/Hearings'));
const DailyBoard = lazy(() => import('@/pages/DailyBoard'));
const StaleCases = lazy(() => import('@/pages/StaleCases'));
const CaseUnknownAdmin = lazy(() => import('@/pages/CaseUnknownAdmin'));
const Documents = lazy(() => import('@/pages/Documents'));
const Notes = lazy(() => import('@/pages/Notes'));
const Team = lazy(() => import('@/pages/Team'));
const Availability = lazy(() => import('@/pages/Availability'));
const ECourts = lazy(() => import('@/pages/ECourts'));
const ModernMessenger = lazy(() => import('@/components/messages/ModernMessenger'));
const Search = lazy(() => import('@/pages/Search'));

// Reception pages (lazy)
const ReceptionHome = lazy(() => import('@/pages/reception/ReceptionHome'));
const ReceptionContacts = lazy(() => import('@/pages/reception/ReceptionContacts'));
const ReceptionAppointments = lazy(() => import('@/pages/reception/ReceptionAppointments'));
const ReceptionDisplayBoard = lazy(() => import('@/pages/reception/ReceptionDisplayBoard'));

// Office Staff pages
import OfficeStaffLayout from '@/components/layout/OfficeStaffLayout';
const StaffDashboard = lazy(() => import('@/pages/staff/StaffDashboard'));

const RoleBasedRouter = () => {
  const { role, loading, isUnassigned, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect users away from reception routes if they're not receptionists
  useEffect(() => {
    if (!loading && role && role !== 'receptionist' && location.pathname.startsWith('/reception')) {
      navigate('/', { replace: true });
    }
  }, [role, loading, location.pathname, navigate]);

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6 mx-auto w-16 h-16">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          </div>
          <h2 className="text-white text-xl font-medium mb-2 tracking-tight">HRU Legal</h2>
          <p className="text-slate-400 text-sm animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  // Handle unassigned users
  if (isUnassigned) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Pending</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Welcome to HRU Legal! Your account is active, but you haven't been assigned to a law firm yet.
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-lg text-sm text-slate-300 border border-slate-700/50">
              Please contact your administrator to be added to a firm.
            </div>
            <button 
              onClick={() => signOut()}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle cases where role is still null after loading is complete
  if (role === null) {
    console.warn("RoleBasedRouter: Role is null after loading. User might not be in team_members table.");
    // We'll fall through to standard layout but log the issue
  }

  // Receptionist routes with special layout
  if (role === 'receptionist') {
    return (
      <ReceptionistLayout>
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<ReceptionHome />} />
            <Route path="/reception/home" element={<ReceptionHome />} />
            <Route path="/reception/contacts" element={<ReceptionContacts />} />
            <Route path="/reception/appointments" element={<ReceptionAppointments />} />
            <Route path="/reception/display-board" element={<ReceptionDisplayBoard />} />
            <Route path="/daily-board" element={<DailyBoard />} />
            <Route path="/chat" element={<ModernMessenger />} />
            <Route path="/messages" element={<ModernMessenger />} />
            <Route path="*" element={<ReceptionHome />} />
          </Routes>
        </Suspense>
      </ReceptionistLayout>
    );
  }

  // Office Staff routes with special layout
  if (role === 'office_staff') {
    return (
      <OfficeStaffLayout>
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<StaffDashboard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<CaseDetailEnhanced />} />
            <Route path="/ecourts" element={<ECourts />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientInfo />} />
            <Route path="/hearings" element={<Hearings />} />
            <Route path="/daily-board" element={<DailyBoard />} />
            <Route path="/stale-cases" element={<StaleCases />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/chat" element={<ModernMessenger />} />
            <Route path="/messages" element={<ModernMessenger />} />
            <Route path="*" element={<StaffDashboard />} />
          </Routes>
        </Suspense>
      </OfficeStaffLayout>
    );
  }

  // Junior users with limited access
  if (role === 'junior') {
    return (
      <DashboardLayout>
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:id" element={<ContactInfo />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<CaseDetailEnhanced />} />
            <Route path="/ecourts" element={<ECourts />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientInfo />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/hearings" element={<Hearings />} />
            <Route path="/daily-board" element={<DailyBoard />} />
            <Route path="/stale-cases" element={<StaleCases />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/chat" element={<ModernMessenger />} />
            <Route path="/messages" element={<ModernMessenger />} />
            <Route path="/search" element={<Search />} />
            <Route path="/team" element={<Index />} />
            <Route path="/reception/*" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </DashboardLayout>
    );
  }

  // Standard layout for all other roles (admin, lawyer, paralegal, etc.)
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactInfo />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetailEnhanced />} />
          <Route path="/ecourts" element={<ECourts />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientInfo />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/hearings" element={<Hearings />} />
          <Route path="/daily-board" element={<DailyBoard />} />
          <Route path="/stale-cases" element={<StaleCases />} />
          <Route path="/case-unknown" element={<CaseUnknownAdmin />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/team" element={<Team />} />
            <Route path="/chat" element={<ModernMessenger />} />
            <Route path="/messages" element={<ModernMessenger />} />
          <Route path="/search" element={<Search />} />
          {/* Fallback for reception routes accessed by non-receptionists */}
          <Route path="/reception/*" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default RoleBasedRouter;
