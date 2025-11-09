import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  Play,
  StopCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import TimeUtils from "@/lib/timeUtils";
import { useNavigate } from "react-router-dom";

interface Case {
  id: string;
  case_title: string;
  case_number: string;
  cnr_number: string | null;
  court_name: string | null;
  status: string;
  created_at: string;
  is_auto_fetched: boolean;
  last_fetched_at: string | null;
  fetch_status: string | null;
  fetch_message: string | null;
}

export const CasesFetchManager = () => {
  const { firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fetchStatusFilter, setFetchStatusFilter] = useState<string>("all");
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [autoFetchProgress, setAutoFetchProgress] = useState({ current: 0, total: 0, currentCase: '' });
  const [stopAutoFetch, setStopAutoFetch] = useState(false);

  // Fetch all cases
  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases-fetch-list', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number, cnr_number, court_name, status, created_at, is_auto_fetched, last_fetched_at, fetch_status, fetch_message')
        .eq('firm_id', firmId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Case[];
    },
    enabled: !!firmId,
  });

  // Single case fetch mutation
  const fetchSingleCase = useMutation({
    mutationFn: async (caseData: Case) => {
      if (!caseData.cnr_number) {
        throw new Error('Case does not have a CNR number');
      }

      // Detect court type from CNR
      const detectCourtType = (cnr: string): string => {
        const prefix = cnr.substring(0, 4).toUpperCase();
        if (prefix.match(/^[A-Z]{2}HC/)) return 'high_court';
        if (prefix.match(/^SCSL|^SC[A-Z]{2}/)) return 'supreme_court';
        return 'district_court';
      };

      const searchType = detectCourtType(caseData.cnr_number);

      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: { 
          action: 'search', 
          cnr: caseData.cnr_number, 
          searchType,
          caseId: caseData.id,
          firmId
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch case data');
      
      return { caseId: caseData.id, data };
    },
    onSuccess: (result) => {
      toast({
        title: "Case Fetched",
        description: "Case details updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['cases-fetch-list'] });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Fetch Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk fetch mutation
  const fetchMultipleCases = useMutation({
    mutationFn: async (caseIds: string[]) => {
      const casesToFetch = cases?.filter(c => caseIds.includes(c.id) && c.cnr_number) || [];
      
      const results = {
        total: casesToFetch.length,
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const caseData of casesToFetch) {
        try {
          await fetchSingleCase.mutateAsync(caseData);
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${caseData.case_number}: ${error.message}`);
        }
        
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Bulk Fetch Complete",
        description: `Successfully fetched ${results.success} out of ${results.total} cases`,
      });
      setSelectedCases(new Set());
      queryClient.invalidateQueries({ queryKey: ['cases-fetch-list'] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Fetch Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generic fetch function for batching cases
  const startBatchFetch = async (casesToFetch: Case[], actionName: string) => {
    if (casesToFetch.length === 0) {
      toast({
        title: "No Cases to Fetch",
        description: `No ${actionName.toLowerCase()} cases with CNR numbers found`,
      });
      return;
    }

    setIsAutoFetching(true);
    setStopAutoFetch(false);
    setAutoFetchProgress({ current: 0, total: casesToFetch.length, currentCase: '' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < casesToFetch.length; i++) {
      if (stopAutoFetch) {
        toast({
          title: "Fetch Stopped",
          description: `Fetched ${successCount} cases before stopping`,
        });
        break;
      }

      const caseData = casesToFetch[i];
      setAutoFetchProgress({
        current: i + 1,
        total: casesToFetch.length,
        currentCase: caseData.case_number || caseData.case_title
      });

      try {
        await fetchSingleCase.mutateAsync(caseData);
        successCount++;
      } catch (error) {
        failCount++;
      }

      // Refresh the list after each fetch
      await queryClient.invalidateQueries({ queryKey: ['cases-fetch-list'] });

      // Delay between fetches (2 seconds)
      if (i < casesToFetch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsAutoFetching(false);
    setAutoFetchProgress({ current: 0, total: 0, currentCase: '' });

    if (!stopAutoFetch) {
      toast({
        title: `${actionName} Complete`,
        description: `Successfully fetched ${successCount} cases. ${failCount > 0 ? `${failCount} failed.` : ''}`,
      });
    }
  };

  // Fetch only unfetched cases (no attempt yet)
  const startUnfetchedOnly = async () => {
    const unfetchedCases = cases?.filter(c => 
      (!c.fetch_status || c.fetch_status === null) && 
      !c.is_auto_fetched && 
      c.cnr_number
    ) || [];
    await startBatchFetch(unfetchedCases, "Unfetched Cases Fetch");
  };

  // Retry only failed cases
  const startRetryFailed = async () => {
    const failedCases = cases?.filter(c => 
      c.fetch_status === 'failed' && 
      c.cnr_number
    ) || [];
    await startBatchFetch(failedCases, "Failed Cases Retry");
  };

  const handleStopAutoFetch = () => {
    setStopAutoFetch(true);
  };

  // Filter cases
  const filteredCases = cases?.filter(c => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !c.case_title?.toLowerCase().includes(query) &&
        !c.case_number?.toLowerCase().includes(query) &&
        !c.cnr_number?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "all" && c.status !== statusFilter) {
      return false;
    }

    // Fetch status filter
    if (fetchStatusFilter === "fetched" && !(c.fetch_status === 'success' || c.is_auto_fetched)) {
      return false;
    }
    if (fetchStatusFilter === "unfetched" && (c.fetch_status || c.is_auto_fetched)) {
      return false;
    }
    if (fetchStatusFilter === "no_cnr" && c.cnr_number) {
      return false;
    }

    return true;
  }) || [];

  // Statistics
  const stats = {
    total: cases?.length || 0,
    fetched: cases?.filter(c => c.fetch_status === 'success' || c.is_auto_fetched).length || 0,
    unfetched: cases?.filter(c => (!c.fetch_status || c.fetch_status === null) && c.cnr_number && !c.is_auto_fetched).length || 0,
    failed: cases?.filter(c => c.fetch_status === 'failed' && c.cnr_number).length || 0,
    noCnr: cases?.filter(c => !c.cnr_number).length || 0,
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const eligibleCases = filteredCases.filter(c => c.cnr_number).map(c => c.id);
      setSelectedCases(new Set(eligibleCases));
    } else {
      setSelectedCases(new Set());
    }
  };

  const handleSelectCase = (caseId: string, checked: boolean) => {
    const newSelected = new Set(selectedCases);
    if (checked) {
      newSelected.add(caseId);
    } else {
      newSelected.delete(caseId);
    }
    setSelectedCases(newSelected);
  };

  const getFetchStatusBadge = (caseData: Case) => {
    if (!caseData.cnr_number) {
      return (
        <Badge variant="outline" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          No CNR
        </Badge>
      );
    }

    // Success if explicit success or legacy is_auto_fetched flag
    if (caseData.fetch_status === 'success' || caseData.is_auto_fetched) {
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          Fetched
        </Badge>
      );
    }

    if (caseData.fetch_status === 'failed') {
      return (
        <Badge variant="error" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    }

    // No attempt yet
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Not Fetched
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Cases</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.fetched}</p>
              <p className="text-sm text-muted-foreground">Fetched</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.unfetched}</p>
              <p className="text-sm text-muted-foreground">Not Fetched</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">{stats.noCnr}</p>
              <p className="text-sm text-muted-foreground">No CNR</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cases Fetch Manager</CardTitle>
              <CardDescription>
                Fetch case details from Legalkart for cases with CNR numbers
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isAutoFetching ? (
                <>
                  <Button
                    onClick={startUnfetchedOnly}
                    disabled={stats.unfetched === 0}
                    variant="default"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Fetch Unfetched ({stats.unfetched})
                  </Button>
                  <Button
                    onClick={startRetryFailed}
                    disabled={stats.failed === 0}
                    variant="secondary"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Failed ({stats.failed})
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleStopAutoFetch}
                  variant="destructive"
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Fetching
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto Fetch Progress */}
          {isAutoFetching && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="font-medium">Auto Fetching Cases...</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {autoFetchProgress.current} of {autoFetchProgress.total}
                    </span>
                  </div>
                  <Progress 
                    value={(autoFetchProgress.current / autoFetchProgress.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Currently fetching: <span className="font-medium">{autoFetchProgress.currentCase}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case title, number, or CNR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Case Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fetchStatusFilter} onValueChange={setFetchStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Fetch Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="fetched">Fetched</SelectItem>
                <SelectItem value="unfetched">Not Fetched</SelectItem>
                <SelectItem value="no_cnr">No CNR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedCases.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">{selectedCases.size} cases selected</span>
              <Button
                onClick={() => fetchMultipleCases.mutate(Array.from(selectedCases))}
                disabled={fetchMultipleCases.isPending}
              >
                {fetchMultipleCases.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" /> Fetch Selected</>
                )}
              </Button>
            </div>
          )}

          {/* Cases Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedCases.size > 0 &&
                        selectedCases.size === filteredCases.filter(c => c.cnr_number).length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Case Details</TableHead>
                  <TableHead>CNR Number</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fetch Status</TableHead>
                  <TableHead>Last Fetched</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((caseData) => (
                    <TableRow key={caseData.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCases.has(caseData.id)}
                          disabled={!caseData.cnr_number}
                          onCheckedChange={(checked) => handleSelectCase(caseData.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{caseData.case_title}</p>
                          <p className="text-xs text-muted-foreground">{caseData.case_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {caseData.cnr_number || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{caseData.court_name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {caseData.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getFetchStatusBadge(caseData)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {caseData.last_fetched_at
                            ? TimeUtils.formatDateTime(caseData.last_fetched_at, 'dd/MM/yy')
                            : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/cases/${caseData.id}`)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {caseData.cnr_number && (
                            <Button
                              size="sm"
                              onClick={() => fetchSingleCase.mutate(caseData)}
                              disabled={fetchSingleCase.isPending}
                            >
                              {fetchSingleCase.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Fetch Status Messages */}
          {filteredCases.some(c => c.fetch_message) && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Fetch Messages:</p>
              {filteredCases
                .filter(c => c.fetch_message)
                .slice(0, 3)
                .map(c => (
                  <div key={c.id} className="text-xs p-2 bg-muted rounded">
                    <span className="font-medium">{c.case_number}:</span> {c.fetch_message}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
