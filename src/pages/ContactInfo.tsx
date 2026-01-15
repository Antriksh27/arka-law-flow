import React from 'react';
import { useParams } from 'react-router-dom';
import { ContactInfoContent } from '../components/contacts/ContactInfoContent';

const ContactInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center text-gray-500">Contact not found</div>
      </div>
    );
  }

  return <ContactInfoContent contactId={id} />;
};

export default ContactInfo;
