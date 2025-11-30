import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, Calendar, Building2, Search, Upload, History, CheckCircle, XCircle, Clock, List } from "lucide-react";
import TimeUtils from '@/lib/timeUtils';
import { LegalkartCaseSearch } from "@/components/cases/LegalkartCaseSearch";
import { CasesUploadSection } from "@/components/ecourts/CasesUploadSection";
import { CasesFetchManager } from "@/components/ecourts/CasesFetchManager";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';

export const ECourts = () => {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { firmId } = useAuth();
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Legalkart" />

        <div className="p-4 space-y-4">
          {/* Stats Strip - Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <div className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm w-32">
              <Search className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold">{totalSearches}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm w-32">
              <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">{successfulSearches}</p>
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
            <div className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm w-32">
              <XCircle className="h-6 w-6 text-red-600 mb-2" />
              <p className="text-2xl font-bold text-red-600">{failedSearches}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="fetch-all" className="space-y-4">
            <TabsList className="w-full overflow-x-auto scrollbar-hide flex">
              <TabsTrigger value="fetch-all" className="flex-1 text-xs whitespace-nowrap">
                <List className="h-4 w-4 mr-1" />
                Fetch All
              </TabsTrigger>
              <TabsTrigger value="search" className="flex-1 text-xs whitespace-nowrap">
                <Search className="h-4 w-4 mr-1" />
                Search
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex-1 text-xs whitespace-nowrap">
                <Upload className="h-4 w-4 mr-1" />
                Bulk
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 text-xs whitespace-nowrap">
                <History className="h-4 w-4 mr-1" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fetch-all" className="mt-0 space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-sm mb-2">Fetch All Cases</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  View and fetch all cases with CNR
                </p>
                <CasesFetchManager />
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-0 space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-sm mb-2">Search by CNR</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Fetch case details from Legalkart
                </p>
                <LegalkartCaseSearch 
                  onCaseDataFetched={() => { 
                    refetch(); 
                    queryClient.invalidateQueries({ queryKey: ["cases"] }); 
                  }} 
                />
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="mt-0 space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-sm mb-2">Bulk Upload</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload multiple cases via CSV/Excel
                </p>
                <CasesUploadSection 
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ["cases"] });
                    refetch();
                  }} 
                />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-3">
              {legalkartCases && legalkartCases.length > 0 ? (
                legalkartCases.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">
                        {item.cases?.case_title || 'Case Search'}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>CNR: {item.cnr_number}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {item.search_type?.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={item.status === 'success' ? 'default' : 'error'}
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    {item.error_message && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                        {item.error_message}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {item.case_id && (
                        <Button 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => navigate(`/cases/${item.case_id}`)}
                        >
                          Open Case
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">No search history</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <BottomNavBar />
      </div>
    );
  }

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
        <Tabs defaultValue="fetch-all" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fetch-all" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Fetch All Cases
              </TabsTrigger>
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
            {/* Fetch All Cases Tab */}
            <TabsContent value="fetch-all" className="space-y-4 mt-0">
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-semibold">Fetch All Cases with CNR</h3>
                <p className="text-sm text-muted-foreground">
                  View all cases and fetch their details from Legalkart. Cases are automatically categorized by fetch status.
                </p>
              </div>
              <CasesFetchManager />
            </TabsContent>

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
