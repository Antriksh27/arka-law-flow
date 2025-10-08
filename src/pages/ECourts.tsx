import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileText, Eye, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { LegalkartCaseSearch } from '@/components/cases/LegalkartCaseSearch';
import { useAuth } from '@/contexts/AuthContext';

const ECourts = () => {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const navigate = useNavigate();
  const { firmId } = useAuth();

  // Fetch all legalkart cases for current firm
  const { data: legalkartCases, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['legalkart-cases', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('firm_id', firmId as string)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId,
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd-MM-yyyy hh:mm a');
    } catch {
      return '-';
    }
  };

  const handleViewJson = (caseData: any) => {
    setSelectedCase(caseData);
    setShowJsonDialog(true);
  };

  const handleViewCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  const handleCaseDataFetched = (data: any) => {
    // Refetch the cases list when new data is fetched to keep the table updated
    refetch();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">eCourts Integration</h1>
        <p className="text-muted-foreground mt-1">
          Search and manage cases from eCourts/Legalkart API
        </p>
      </div>

      {/* Legalkart Case Search */}
      <LegalkartCaseSearch onCaseDataFetched={handleCaseDataFetched} />

      <Separator className="my-8" />

      {/* Fetched Cases Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Previously Fetched Cases</h2>
          <p className="text-muted-foreground mt-1">
            All cases that have been fetched and stored from eCourts API
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {legalkartCases?.length || 0} Cases
        </Badge>
      </div>

      {/* Cases List */}
      {legalkartCases && legalkartCases.length > 0 ? (
        <div className="grid gap-4">
          {legalkartCases.map((item: any) => (
            <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Case Title & Number */}
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      {item.petitioner_and_advocate || item.respondent_and_advocate
                        ? `${item.petitioner_and_advocate ?? ''}${item.respondent_and_advocate ? ` vs ${item.respondent_and_advocate}` : ''}`
                        : 'Legalkart Case'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        CNR: {item.cnr_number}
                      </span>
                      {item.registration_number && (
                        <span>Reg No: {item.registration_number}</span>
                      )}
                      {item.filing_number && (
                        <span>Filing No: {item.filing_number}</span>
                      )}
                    </div>
                  </div>

                  {/* Court & Details */}
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    {(item.state || item.district || item.judicial_branch) && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {[item.state, item.district].filter(Boolean).join(', ')}
                        {item.judicial_branch ? ` • ${item.judicial_branch}` : ''}
                      </span>
                    )}
                    {item.stage_of_case && (
                      <Badge className="capitalize">{item.stage_of_case}</Badge>
                    )}
                    {item.bench_type && (
                      <Badge variant="outline" className="capitalize">
                        {item.bench_type}
                      </Badge>
                    )}
                    {item.sub_category && (
                      <Badge variant="outline" className="capitalize">
                        {item.sub_category}
                      </Badge>
                    )}
                    {item.next_hearing_date && (
                      <span className="text-xs">
                        Next hearing: {formatDate(item.next_hearing_date)}
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Fetched: {formatDate(item.created_at)}
                    </span>
                    <span>Last Updated: {formatDate(item.updated_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewJson(item)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {item.case_id && (
                    <Button size="sm" onClick={() => handleViewCase(item.case_id)}>
                      View Case
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-xl font-semibold mb-2">No Fetched Cases</h3>
              <p className="text-muted-foreground">
                Cases fetched from eCourts API will appear here
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* JSON Viewer Dialog */}
      <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Fetched Case Data - JSON Output</DialogTitle>
            {selectedCase?.cnr_number && (
              <p className="text-sm text-muted-foreground">
                CNR: {selectedCase.cnr_number}
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/50 rounded-lg p-4">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(selectedCase, null, 2)}
            </pre>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowJsonDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ECourts;
