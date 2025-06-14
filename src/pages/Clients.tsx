
import React from 'react';
import { ClientList } from '../components/clients/ClientList';

const Clients = () => {
  console.log('Clients page rendering...');
  
  return (
    <div className="space-y-6">
      <ClientList />
    </div>
  );
};

export default Clients;
