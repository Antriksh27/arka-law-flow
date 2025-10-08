import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Eye, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const ECourts = () => {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const navigate = useNavigate();

  // Fetch all legalkart cases
  const { data: legalkartCases, isLoading } = useQuery({
    queryKey: ['legalkart-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_cases')
        .select(`
          *,
          cases (
            id,
            case_title,
            case_number,
            court_name,
            status,
            created_at
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">eCourts Fetched Cases</h1>
          <p className="text-muted-foreground mt-1">
            View all cases fetched from eCourts/Legalkart API
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
                      {item.cases?.case_title || 'Untitled Case'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {item.cnr_number}
                      </span>
                      {item.cases?.case_number && (
                        <span>Case No: {item.cases.case_number}</span>
                      )}
                    </div>
                  </div>

                  {/* Court & Status */}
                  <div className="flex items-center gap-4 text-sm">
                    {item.cases?.court_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {item.cases.court_name}
                      </span>
                    )}
                    {item.cases?.status && (
                      <Badge className="capitalize">
                        {item.cases.status.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Fetched: {formatDate(item.created_at)}
                    </span>
                    <span>
                      Last Updated: {formatDate(item.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewJson(item)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View JSON
                  </Button>
                  {item.case_id && (
                    <Button
                      size="sm"
                      onClick={() => handleViewCase(item.case_id)}
                    >
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
