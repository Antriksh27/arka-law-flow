import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClientEmailsProps {
  clientId: string;
}

// We'll list emails for all cases of this client
export const ClientEmails: React.FC<ClientEmailsProps> = ({ clientId }) => {
  const isMobile = useIsMobile();
  const { data, isLoading, error } = useQuery({
    queryKey: ['client-emails', clientId],
    queryFn: async () => {
      // First fetch all case ids for this client
      const { data: cases, error: caseError } = await supabase
        .from('cases')
        .select('id, case_title')
        .eq('client_id', clientId);

      if (caseError) throw caseError;

      const caseIds = cases?.map((c: any) => c.id) || [];

      if (caseIds.length === 0) return [];

      // Now fetch emails related to these cases
      const { data: emails, error: emailError } = await supabase
        .from('case_emails')
        .select('id, subject, content, sent_at, sender, recipients, attachments, case_id')
        .in('case_id', caseIds)
        .order('sent_at', { ascending: false });
      if (emailError) throw emailError;

      // Get case titles for mapping
      const caseMap: Record<string, string> = {};
      cases.forEach((c: any) => caseMap[c.id] = c.title);

      return emails.map(email => ({
        ...email,
        case_title: caseMap[email.case_id] || undefined
      }));
    }
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading emails...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-gray-500 py-8">
            <Mail className="w-8 h-8 mb-2" />
            <span>Unable to load emails.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className={isMobile ? "p-4" : "p-6"}>
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className={isMobile ? "text-sm" : ""}>No emails found for this client.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Emails</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-2">
            {data.map((email: any) => (
              <Card key={email.id} className="active:scale-95 transition-transform">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-sm text-gray-900 flex-1">
                      {email.subject || <span className="text-gray-400">No Subject</span>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {email.sent_at ? new Date(email.sent_at).toLocaleString() : '—'}
                  </div>
                  {email.case_title && (
                    <div className="text-xs mb-2 text-blue-700 font-medium">{email.case_title}</div>
                  )}
                  {email.content && (
                    <div className="text-xs text-gray-600 line-clamp-2 mb-2">{email.content}</div>
                  )}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>From: {email.sender}</div>
                    {email.recipients && email.recipients.length > 0 && (
                      <div className="truncate">To: {email.recipients.join(', ')}</div>
                    )}
                    {email.attachments && email.attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Emails</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((email: any) => (
            <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <div className="font-medium text-gray-900">{email.subject || <span className="text-gray-400">No Subject</span>}</div>
                <div className="text-xs text-muted-foreground">
                  {email.sent_at ? new Date(email.sent_at).toLocaleString() : '—'}
                </div>
              </div>
              {email.case_title && (
                <div className="text-xs mb-1 text-blue-700">{email.case_title}</div>
              )}
              {email.content && (
                <div className="text-gray-600 text-sm line-clamp-3 mb-1">{email.content}</div>
              )}
              <div className="flex gap-4 items-center text-xs text-muted-foreground">
                <span>From: {email.sender}</span>
                {email.recipients && email.recipients.length > 0 && (
                  <span className="truncate">To: {email.recipients.join(', ')}</span>
                )}
                {email.attachments && email.attachments.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
