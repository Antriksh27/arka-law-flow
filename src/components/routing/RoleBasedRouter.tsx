import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';

// Main application pages
import Index from '@/pages/Index';
import Contacts from '@/pages/Contacts';
import Cases from '@/pages/Cases';
import CaseDetailEnhanced from '@/pages/CaseDetailEnhanced';
import Clients from '@/pages/Clients';
import ClientInfo from '@/pages/ClientInfo';
import Appointments from '@/pages/Appointments';
import Tasks from '@/pages/Tasks';
import Hearings from '@/pages/Hearings';
import Documents from '@/pages/Documents';
import Notes from '@/pages/Notes';
import Invoices from '@/pages/Invoices';
import Team from '@/pages/Team';
import Messages from '@/pages/Messages';
import Instructions from '@/pages/Instructions';
import Availability from '@/pages/Availability';
import ECourts from '@/pages/ECourts';
import NotFound from '@/pages/NotFound';
import ModernMessenger from '@/components/messages/ModernMessenger';

// Reception pages
import ReceptionHome from '@/pages/reception/ReceptionHome';
import ReceptionContacts from '@/pages/reception/ReceptionContacts';
import ReceptionAppointments from '@/pages/reception/ReceptionAppointments';
import ReceptionSchedule from '@/pages/reception/ReceptionSchedule';
import ReceptionCalendar from '@/pages/reception/ReceptionCalendar';

// Office Staff pages
import OfficeStaffLayout from '@/components/layout/OfficeStaffLayout';
import StaffDashboard from '@/pages/staff/StaffDashboard';
import StaffCases from '@/pages/staff/StaffCases';
import StaffDocuments from '@/pages/staff/StaffDocuments';
import StaffTasks from '@/pages/staff/StaffTasks';
import OfficeStaffClientList from '@/components/clients/OfficeStaffClientList';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#6B7280]">Loading...</div>
      </div>
    );
  }

  // Receptionist routes with special layout
  if (role === 'receptionist') {
    return (
      <ReceptionistLayout>
        <Routes>
          <Route path="/" element={<ReceptionHome />} />
          <Route path="/reception/home" element={<ReceptionHome />} />
          <Route path="/reception/contacts" element={<ReceptionContacts />} />
          <Route path="/reception/appointments" element={<ReceptionAppointments />} />
          <Route path="/reception/schedule" element={<ReceptionSchedule />} />
          <Route path="/reception/calendar" element={<ReceptionCalendar />} />
          <Route path="/chat" element={<ModernMessenger />} />
          <Route path="*" element={<ReceptionHome />} />
        </Routes>
      </ReceptionistLayout>
    );
  }

  // Office Staff routes with special layout
  if (role === 'office_staff') {
    return (
      <OfficeStaffLayout>
        <Routes>
          <Route path="/" element={<StaffDashboard />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/cases" element={<Cases />} />
          <Route path="/staff/cases/:id" element={<CaseDetailEnhanced />} />
          <Route path="/ecourts" element={<ECourts />} />
          <Route path="/staff/clients" element={<Clients />} />
          <Route path="/staff/clients/:id" element={<ClientInfo />} />
          <Route path="/staff/hearings" element={<Hearings />} />
          <Route path="/staff/documents" element={<Documents />} />
          <Route path="/staff/tasks" element={<Tasks />} />
          <Route path="/staff/instructions" element={<Instructions />} />
          <Route path="/staff/invoices" element={<Invoices />} />
          <Route path="/chat" element={<ModernMessenger />} />
          <Route path="*" element={<StaffDashboard />} />
        </Routes>
      </OfficeStaffLayout>
    );
  }

  // Junior users with limited access
  if (role === 'junior') {
    return (
      <DashboardLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetailEnhanced />} />
        <Route path="/ecourts" element={<ECourts />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientInfo />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/hearings" element={<Hearings />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/chat" element={<ModernMessenger />} />
        {/* Redirect invoices to dashboard for juniors */}
        <Route path="/invoices" element={<Index />} />
        <Route path="/team" element={<Index />} />
        <Route path="/reception/*" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </DashboardLayout>
    );
  }

  // Standard layout for all other roles (admin, lawyer, paralegal, etc.)
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetailEnhanced />} />
        <Route path="/ecourts" element={<ECourts />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientInfo />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/hearings" element={<Hearings />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/team" element={<Team />} />
        <Route path="/chat" element={<ModernMessenger />} />
        {/* Fallback for reception routes accessed by non-receptionists */}
        <Route path="/reception/*" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
};

export default RoleBasedRouter;