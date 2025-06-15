import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface JoinHruLegalProps {
  user: User;
}

export function JoinHruLegal({ user }: JoinHruLegalProps) {
  const [status, setStatus] = useState('initializing'); // initializing, creating_request, pending_approval, error

  useEffect(() => {
    const processJoinRequest = async () => {
      if (!user) return;

      try {
        console.log("JoinHruLegal: Starting join process...");
        // 1. Get HRU LEGAL firm ID
        console.log("JoinHruLegal: Fetching firm ID for HRU LEGAL...");
        const { data: firm, error: firmError } = await supabase
          .from('law_firms')
          .select('id')
          .eq('name', 'HRU LEGAL')
          .single();

        if (firmError) throw firmError;
        if (!firm) {
          const err = new Error('Could not find the default law firm. Please contact support.');
          console.error('Error fetching firm:', err);
          toast.error(err.message);
          setStatus('error');
          return;
        }
        const firmId = firm.id;
        console.log("JoinHruLegal: Firm ID found:", firmId);

        // 2. Check if a request already exists
        console.log("JoinHruLegal: Checking for existing team member request...");
        const { data: existingMember, error: existingMemberError } = await supabase
          .from('team_members')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('firm_id', firmId)
          .maybeSingle();

        if (existingMemberError) {
          console.error("JoinHruLegal: Error checking for existing member:", existingMemberError);
          throw existingMemberError;
        }

        if (existingMember) {
          console.log("JoinHruLegal: Existing member found with status:", existingMember.status);
          setStatus('pending_approval');
          return;
        }
        console.log("JoinHruLegal: No existing member found. Creating new request.");

        // 3. Create a join request
        setStatus('creating_request');
        toast.info('Sending join request to HRU LEGAL...');
        console.log("JoinHruLegal: Inserting new team member request...");
        const { error: insertError } = await supabase.from('team_members').insert({
          user_id: user.id,
          firm_id: firmId,
          role: 'junior',
          status: 'pending',
          full_name: user.user_metadata?.full_name || user.email,
          email: user.email,
        });

        if (insertError) {
          console.error("JoinHruLegal: Error inserting new member:", insertError);
          throw insertError;
        }

        console.log("JoinHruLegal: Join request successful.");
        toast.success('Your request has been sent for approval.');
        setStatus('pending_approval');

      } catch (e: any) {
        console.error('Error during join process:', e);
        toast.error(`Failed to process join request: ${e.message}`);
        setStatus('error');
      }
    };

    processJoinRequest();
  }, [user]);

  let content;
  if (status === 'initializing' || status === 'creating_request') {
    content = (
        <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
  } else if (status === 'pending_approval') {
    content = (
      <>
        <p className="text-muted-foreground">Your request to join HRU LEGAL has been sent.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          An administrator must approve your request before you can access the team features. Please check back later or contact an admin.
        </p>
      </>
    );
  } else {
    content = <p className="text-destructive">Something went wrong. Please try refreshing the page or contact support.</p>;
  }


  return (
    <div className="container max-w-2xl flex h-full w-full flex-col items-center justify-center gap-6 py-12 bg-slate-50">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to HRU LEGAL</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    </div>
  );
}
