import React from 'react';
import { useParams } from 'react-router-dom';
import { ClientInfoContent } from '../components/clients/ClientInfoContent';

const ClientInfo = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-500">Client not found</div>
      </div>
    );
  }

  return (
    <ClientInfoContent clientId={id} />
  );
};

export default ClientInfo;
