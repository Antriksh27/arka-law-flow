import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Gavel, Calendar, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ClientDetailsTabProps {
  caseData: any;
}

export const ClientDetailsTab: React.FC<ClientDetailsTabProps> = ({ caseData }) => {
  // Fetch hearings
  const { data: hearings } = useQuery({
    queryKey: ['client-case-hearings', caseData.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_hearings')
        .select('*')
        .eq('case_id', caseData.id)
        .order('hearing_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch orders
  const { data: orders } = useQuery({
    queryKey: ['client-case-orders', caseData.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_orders')
        .select('*')
        .eq('case_id', caseData.id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch shared documents
  const { data: documents } = useQuery({
    queryKey: ['client-case-documents', caseData.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseData.id)
        .eq('is_shared_with_client', true)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const renderField = (label: string, value: any) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Case Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Case Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {renderField('CNR Number', caseData.cnr_number)}
          {renderField('Case Number', caseData.case_number)}
          {renderField('Filing Number', caseData.filing_number)}
          {renderField('Filing Date', caseData.filing_date ? format(new Date(caseData.filing_date), 'dd MMM yyyy') : null)}
          {renderField('Court Name', caseData.court_name)}
          {renderField('Case Type', caseData.case_type)}
          {renderField('Status', caseData.status)}
          {renderField('Stage', caseData.stage)}
          {renderField('Next Hearing Date', caseData.next_hearing_date ? format(new Date(caseData.next_hearing_date), 'dd MMM yyyy') : null)}
        </CardContent>
      </Card>

      {/* Parties & Advocates */}
      {(caseData.petitioner || caseData.respondent) && (
        <Card>
          <CardHeader>
            <CardTitle>Parties & Advocates</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            {caseData.petitioner && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                  <h3 className="font-semibold text-primary">Petitioner</h3>
                </div>
                <p className="text-sm">{caseData.petitioner}</p>
                {caseData.petitioner_advocate && (
                  <div className="pt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Advocate</p>
                    <p className="text-sm">{caseData.petitioner_advocate}</p>
                  </div>
                )}
              </div>
            )}
            {caseData.respondent && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-destructive/20">
                  <h3 className="font-semibold text-destructive">Respondent</h3>
                </div>
                <p className="text-sm">{caseData.respondent}</p>
                {caseData.respondent_advocate && (
                  <div className="pt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Advocate</p>
                    <p className="text-sm">{caseData.respondent_advocate}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hearings History */}
      {hearings && hearings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Hearings History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hearings.map((hearing) => (
                <div key={hearing.id} className="flex gap-4 p-3 rounded-lg border bg-card">
                  <div className="shrink-0">
                    {hearing.hearing_date && (
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {format(new Date(hearing.hearing_date), 'dd')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(hearing.hearing_date), 'MMM yyyy')}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    {hearing.court_name && (
                      <p className="text-sm font-medium">{hearing.court_name}</p>
                    )}
                    {hearing.status && (
                      <Badge variant="outline" className="text-xs">
                        {hearing.status}
                      </Badge>
                    )}
                    {hearing.outcome && (
                      <p className="text-sm text-muted-foreground">{hearing.outcome}</p>
                    )}
                    {hearing.next_hearing_date && (
                      <p className="text-xs text-muted-foreground">
                        Next: {format(new Date(hearing.next_hearing_date), 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders */}
      {orders && orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      {order.order_number && (
                        <p className="font-medium text-sm">Order #{order.order_number}</p>
                      )}
                      {order.order_date && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.order_date), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                    {order.order_link && (
                      <a
                        href={order.order_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View PDF
                      </a>
                    )}
                  </div>
                  {order.order_details && (
                    <p className="text-sm text-muted-foreground">{order.order_details}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents Shared With You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      {doc.uploaded_at && (
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {format(new Date(doc.uploaded_at), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline shrink-0 ml-4"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hearings?.length && !orders?.length && !documents?.length && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              No additional case details available at the moment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};