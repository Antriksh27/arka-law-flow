
import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ClientList } from '../components/clients/ClientList';

const Clients = () => {
  return (
    <DashboardLayout>
      <ClientList />
    </DashboardLayout>
  );
};

export default Clients;
