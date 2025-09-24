import React from 'react';
import { ContactList } from '../components/contacts/ContactList';

const Contacts = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <ContactList />
    </div>
  );
};

export default Contacts;