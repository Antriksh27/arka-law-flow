import React from 'react';
import { ContactList } from '../components/contacts/ContactList';

const Contacts: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <ContactList />
    </div>
  );
};

export default Contacts;