import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, Calendar, Building2, Search, Upload, History, CheckCircle, XCircle, Clock } from "lucide-react";
import TimeUtils from '@/lib/timeUtils';
import { LegalkartCaseSearch } from "@/components/cases/LegalkartCaseSearch";
import { CasesUploadSection } from "@/components/ecourts/CasesUploadSection";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ECourts = () => {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { firmId } = useAuth();

  const { data: legalkartCases, refetch } = useQuery({
    queryKey: ['legalkart-case-searches', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_case_searches')
        .select(`*, cases (id, case_title, case_number, court_name)`)
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
      return TimeUtils.formatDateTime(date, 'dd/MM/yyyy hh:mm a');
    } catch {
      return '-';
    }
  };

  // Get statistics for the overview
  const successfulSearches = legalkartCases?.filter((c: any) => c.status === 'success').length || 0;
  const failedSearches = legalkartCases?.filter((c: any) => c.status === 'failed').length || 0;
  const totalSearches = legalkartCases?.length || 0;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Legalkart Integration</h1>
        <p className="text-muted-foreground">Fetch and sync case details directly from Legalkart API</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Searches</p>
                <p className="text-2xl font-bold">{totalSearches}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{successfulSearches}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedSearches}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <Tabs defaultValue="search" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Cases
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Upload
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4 mt-0">
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-semibold">Search Case by CNR</h3>
                <p className="text-sm text-muted-foreground">
                  Enter a CNR number to fetch complete case details from Legalkart including parties, documents, hearings, and orders
                </p>
              </div>
              <LegalkartCaseSearch 
                onCaseDataFetched={() => { 
                  refetch(); 
                  queryClient.invalidateQueries({ queryKey: ["cases"] }); 
                }} 
              />
            </TabsContent>

            {/* Bulk Upload Tab */}
            <TabsContent value="bulk" className="space-y-4 mt-0">
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-semibold">Bulk Upload Cases</h3>
                <p className="text-sm text-muted-foreground">
                  Upload multiple cases at once using CSV or Excel format. Cases will be created with the provided CNR numbers.
                </p>
              </div>
              <CasesUploadSection 
                onUploadComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ["cases"] });
                  refetch();
                }} 
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-0">
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-semibold">Search History</h3>
                <p className="text-sm text-muted-foreground">
                  View all previous Legalkart searches and their results
                </p>
              </div>

              {legalkartCases && legalkartCases.length > 0 ? (
                <div className="space-y-3">
                  {legalkartCases.map((item: any) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <h4 className="font-semibold text-lg mb-1">
                                {item.cases?.case_title || 'Case Search'}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  CNR: {item.cnr_number}
                                </span>
                                {item.cases?.case_number && (
                                  <span>Case No: {item.cases.case_number}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="capitalize">
                                {item.search_type?.replace('_', ' ')}
                              </Badge>
                              <Badge 
                                variant={item.status === 'success' ? 'default' : 'error'}
                                className="capitalize"
                              >
                                {item.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {item.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                                {item.status}
                              </Badge>
                              {item.cases?.court_name && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  {item.cases.court_name}
                                </span>
                              )}
                            </div>

                            {item.error_message && (
                              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                {item.error_message}
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.created_at)}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {item.response_data && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { 
                                  setSelectedCase(item); 
                                  setShowJsonDialog(true); 
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Data
                              </Button>
                            )}
                            {item.case_id && (
                              <Button 
                                size="sm" 
                                onClick={() => navigate(`/cases/${item.case_id}`)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Open Case
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No search history yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Searches you perform will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Response Data Dialog */}
      <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Search Response Data</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto bg-muted/50 rounded-lg p-4">
            <pre className="text-xs">{JSON.stringify(selectedCase?.response_data, null, 2)}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ECourts;
