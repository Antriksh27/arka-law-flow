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

  // Fetch all legalkart case searches for current firm
  const { data: legalkartCases, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['legalkart-case-searches', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_case_searches')
        .select(`
          *,
          cases (
            id,
            case_title,
            case_number,
            court_name
          )
        `)
        .eq('firm_id', firmId as string)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId,
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy hh:mm a');
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
                  {/* Case Title & CNR */}
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      {item.cases?.case_title || 'Case Search'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        CNR: {item.cnr_number}
                      </span>
                      {item.cases?.case_number && (
                        <span>Case No: {item.cases.case_number}</span>
                      )}
                    </div>
                  </div>

                  {/* Search Details */}
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <Badge variant="outline" className="capitalize">
                      {item.search_type?.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant={item.status === 'success' ? 'default' : 'error'}
                      className="capitalize"
                    >
                      {item.status}
                    </Badge>
                    {item.cases?.court_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {item.cases.court_name}
                      </span>
                    )}
                  </div>

                  {/* Error Message */}
                  {item.error_message && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {item.error_message}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Searched: {formatDate(item.created_at)}
                    </span>
                    {item.updated_at !== item.created_at && (
                      <span>Updated: {formatDate(item.updated_at)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {item.response_data && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewJson(item)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Response
                    </Button>
                  )}
                  {item.case_id && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/cases/${item.case_id}/legalkart-details`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => handleViewCase(item.case_id)}
                      >
                        View Case
                      </Button>
                    </>
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
            <DialogTitle>Search Response Data</DialogTitle>
            {selectedCase?.cnr_number && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>CNR: {selectedCase.cnr_number}</p>
                <p>Search Type: {selectedCase.search_type?.replace('_', ' ')}</p>
                <p>Status: {selectedCase.status}</p>
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/50 rounded-lg p-4">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(selectedCase?.response_data || selectedCase, null, 2)}
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
