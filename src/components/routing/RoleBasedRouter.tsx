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
import Cases from '@/pages/Cases';
const CaseDetailEnhanced = lazy(() => import('@/pages/CaseDetailEnhanced'));
const Clients = lazy(() => import('@/pages/Clients'));
const ClientInfo = lazy(() => import('@/pages/ClientInfo'));
const Appointments = lazy(() => import('@/pages/Appointments'));
const Tasks = lazy(() => import('@/pages/Tasks'));
const Hearings = lazy(() => import('@/pages/Hearings'));
const DailyBoard = lazy(() => import('@/pages/DailyBoard'));
const StaleCases = lazy(() => import('@/pages/StaleCases'));
const Documents = lazy(() => import('@/pages/Documents'));
const Notes = lazy(() => import('@/pages/Notes'));
const Team = lazy(() => import('@/pages/Team'));
const Availability = lazy(() => import('@/pages/Availability'));
const ECourts = lazy(() => import('@/pages/ECourts'));
const ModernMessenger = lazy(() => import('@/components/messages/ModernMessenger'));
const Search = lazy(() => import('@/pages/Search'));

// Reception pages
import ReceptionHome from '@/pages/reception/ReceptionHome';
import ReceptionContacts from '@/pages/reception/ReceptionContacts';
import ReceptionAppointments from '@/pages/reception/ReceptionAppointments';
import ReceptionSchedule from '@/pages/reception/ReceptionSchedule';
import ReceptionCalendar from '@/pages/reception/ReceptionCalendar';
import ReceptionDisplayBoard from '@/pages/reception/ReceptionDisplayBoard';

// Office Staff pages
import OfficeStaffLayout from '@/components/layout/OfficeStaffLayout';
import StaffDashboard from '@/pages/staff/StaffDashboard';

const RoleBasedRouter = () => {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect users away from reception routes if they're not receptionists
  useEffect(() => {
    if (!loading && role && role !== 'receptionist' && location.pathname.startsWith('/reception')) {
      navigate('/', { replace: true });
    }
  }, [role, loading, location.pathname, navigate]);

  // Show loading while auth is loading OR while role is being fetched
  if (loading || role === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <div className="text-[#6B7280] text-sm">Loading...</div>
        </div>
      </div>
    );
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
            <Route path="/reception/schedule" element={<ReceptionSchedule />} />
            <Route path="/reception/calendar" element={<ReceptionCalendar />} />
            <Route path="/reception/display-board" element={<ReceptionDisplayBoard />} />
            <Route path="/chat" element={<ModernMessenger />} />
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
          <Route path="/documents" element={<Documents />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/team" element={<Team />} />
          <Route path="/chat" element={<ModernMessenger />} />
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