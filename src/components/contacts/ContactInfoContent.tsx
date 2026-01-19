import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContactTabs } from './ContactTabs';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobilePageContainer } from '@/components/mobile/MobilePageContainer';
import { Skeleton } from '@/components/ui/skeleton';

interface ContactInfoContentProps {
  contactId: string;
}

export const ContactInfoContent: React.FC<ContactInfoContentProps> = ({ contactId }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  // Mobile Loading State
  if (isLoading && isMobile) {
    return (
      <MobilePageContainer>
        <MobileHeader title="Loading..." showBack />
        <div className="p-4 space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          
          {/* Content skeleton */}
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </MobilePageContainer>
    );
  }

  // Desktop Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading contact...</p>
        </div>
      </div>
    );
  }

  // Mobile Error State
  if ((error || !contact) && isMobile) {
    return (
      <MobilePageContainer>
        <MobileHeader title="Contact" showBack />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Contact not found</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            This contact may have been deleted or you don't have access.
          </p>
          <Button onClick={() => navigate('/contacts')} className="min-h-[48px]">
            Back to Contacts
          </Button>
        </div>
      </MobilePageContainer>
    );
  }

  // Desktop Error State
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
