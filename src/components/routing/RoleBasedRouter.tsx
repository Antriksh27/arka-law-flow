import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';

// Main application pages
import Index from '@/pages/Index';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
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
import NotFound from '@/pages/NotFound';

// Reception pages
import ReceptionHome from '@/pages/reception/ReceptionHome';
import ReceptionContacts from '@/pages/reception/ReceptionContacts';
import ReceptionAppointments from '@/pages/reception/ReceptionAppointments';
import ReceptionSchedule from '@/pages/reception/ReceptionSchedule';

const RoleBasedRouter = () => {
  const { role, loading } = useAuth();

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
          <Route path="*" element={<ReceptionHome />} />
        </Routes>
      </ReceptionistLayout>
    );
  }

  // Standard layout for all other roles (admin, lawyer, paralegal, etc.)
  return (
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
        {/* Fallback for reception routes accessed by non-receptionists */}
        <Route path="/reception/*" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
};

export default RoleBasedRouter;