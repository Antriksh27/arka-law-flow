
import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ClientInfoContent } from '../components/clients/ClientInfoContent';

const ClientInfo = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-gray-500">Client not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ClientInfoContent clientId={id} />
    </DashboardLayout>
  );
};

export default ClientInfo;
