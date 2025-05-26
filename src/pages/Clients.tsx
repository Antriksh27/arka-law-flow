
import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ClientList } from '../components/clients/ClientList';

const Clients = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <ClientList />
      </div>
    </DashboardLayout>
  );
};

export default Clients;
