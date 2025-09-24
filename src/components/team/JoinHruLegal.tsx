
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
          // If member exists but is not active, we might want to handle that.
          // For now, if they exist in any state, we assume the process is handled.
          // A reload will ensure AuthContext picks up the firmId if they are active.
          console.log("JoinHruLegal: Existing member found. Status:", existingMember.status, ". Reloading to ensure correct state.");
          window.location.reload();
          return;
        }
        console.log("JoinHruLegal: No existing member found. Creating new active member.");

        // 3. Create an active member record
        setStatus('creating_request');
        toast.info('Automatically joining HRU LEGAL...');
        console.log("JoinHruLegal: Inserting new team member as 'active'...");
        const { error: insertError } = await supabase.from('team_members').insert({
          user_id: user.id,
          firm_id: firmId,
          role: 'lawyer',
          status: 'active', // Auto-confirm by setting status to active
          full_name: user.user_metadata?.full_name || user.email,
          email: user.email,
        });

        if (insertError) {
          console.error("JoinHruLegal: Error inserting new member:", insertError);
          throw insertError;
        }

        console.log("JoinHruLegal: Join successful, user is now active.");
        toast.success('You have successfully joined HRU LEGAL! Refreshing...');
        
        // Force a page reload to re-initialize AuthContext and load the team page
        setTimeout(() => window.location.reload(), 1500);

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
        <div className="space-y-4">
            <p className="text-muted-foreground">Finalizing your account setup...</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
  } else if (status === 'pending_approval') {
    // This state will be brief before reload
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
