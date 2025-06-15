
import React from 'react';
import { ClientList } from '../components/clients/ClientList';

const Clients = () => {
  console.log('Clients page rendering...');
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <ClientList />
    </div>
  );
};

export default Clients;
