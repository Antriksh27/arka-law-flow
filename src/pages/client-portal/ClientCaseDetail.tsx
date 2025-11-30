import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ClientDetailsTab } from '@/components/client-portal/ClientDetailsTab';

const ClientCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['client-case-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Case not found</p>
        <Button onClick={() => navigate('/client/cases')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/client/cases')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{caseData.case_title}</h1>
          <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
            {caseData.cnr_number && (
              <span className="font-mono">CNR: {caseData.cnr_number}</span>
            )}
            {caseData.case_number && (
              <span>• Case No: {caseData.case_number}</span>
            )}
          </div>
        </div>
      </div>

      {/* Case Details - Read Only */}
      <ClientDetailsTab caseData={caseData} />
    </div>
  );
};

export default ClientCaseDetail;