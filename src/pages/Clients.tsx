import React from 'react';
import { ClientList } from '../components/clients/ClientList';
import { MobilePageContainer } from '../components/mobile/MobilePageContainer';

const Clients = () => {
  console.log('Clients page rendering...');
  
  return (
    <MobilePageContainer>
      <ClientList />
    </MobilePageContainer>
  );
};

export default Clients;
