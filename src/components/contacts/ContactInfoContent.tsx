import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContactTabs } from './ContactTabs';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ContactInfoContentProps {
  contactId: string;
}

export const ContactInfoContent: React.FC<ContactInfoContentProps> = ({ contactId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: contact, isLoading, error, refetch } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, states(name), districts(name)')
        .eq('id', contactId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center text-gray-500">
          <p className="mb-4">Contact not found or an error occurred.</p>
          <Button onClick={() => navigate('/contacts')}>
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ContactTabs
      contactId={contactId}
      contact={contact}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onUpdate={refetch}
    />
  );
};
