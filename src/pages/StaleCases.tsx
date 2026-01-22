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
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Search,
  AlertTriangle,
  Calendar,
  Eye,
  StopCircle,
  ArrowLeft,
  ToggleRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import TimeUtils from "@/lib/timeUtils";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/mobile/MobileHeader";

import { differenceInDays } from "date-fns";
import { useEnableAutoFetchPending } from "@/hooks/useEnableAutoFetchPending";

interface StaleCase {
  id: string;
  case_title: string;
  case_number: string | null;
  cnr_number: string | null;
  court_name: string | null;
  next_hearing_date: string;
  last_fetched_at: string | null;
  fetch_status: string | null;
  is_auto_fetched: boolean;
  court_type: string | null;
}

const StaleCases = () => {
  const { firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const enableAutoFetchMutation = useEnableAutoFetchPending();
  
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [daysFilter, setDaysFilter] = useState<string>("all");
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>("all");
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [autoFetchProgress, setAutoFetchProgress] = useState({ current: 0, total: 0, currentCase: '' });
  const [stopAutoFetch, setStopAutoFetch] = useState(false);

  // Fetch stale cases (next_hearing_date in the past, but not older than 1 year)
  const { data: staleCases, isLoading } = useQuery({
    queryKey: ['stale-cases', firmId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      // Calculate date 1 year ago
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number, cnr_number, court_name, next_hearing_date, last_fetched_at, fetch_status, is_auto_fetched, court_type')
        .eq('firm_id', firmId!)
        .lt('next_hearing_date', today)
        .gte('next_hearing_date', oneYearAgoStr) // Exclude cases older than 1 year
        .not('next_hearing_date', 'is', null)
        .order('next_hearing_date', { ascending: true });
      
      if (error) throw error;
      return data as StaleCase[];
    },
    enabled: !!firmId,
  });

  // Detect court type from CNR
  const detectCourtType = (cnr: string): string => {
    const prefix = cnr.substring(0, 4).toUpperCase();
    if (prefix.match(/^[A-Z]{2}HC/)) return 'high_court';
    if (prefix.match(/^SCSL|^SC[A-Z]{2}|^SCIN/)) return 'supreme_court';
    return 'district_court';
  };

  const getInvokeErrorMessage = (err: any): string => {
    // Supabase function invoke errors sometimes include a `context` with response body.
    const msg = err?.message || 'Unknown error';

    const body = err?.context?.body;
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return parsed?.error || parsed?.message || msg;
      } catch {
        // ignore
      }
    }

    // Some errors come as plain objects
    if (typeof err === 'string') return err;
    if (err?.error) return String(err.error);

    return msg;
  };

  // Single case fetch mutation
  const fetchSingleCase = useMutation({
    mutationFn: async (caseData: StaleCase) => {
      if (!caseData.cnr_number) {
        throw new Error('Case does not have a CNR number');
      }

      const searchType = detectCourtType(caseData.cnr_number);

      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'search',
          cnr: caseData.cnr_number,
          searchType,
          caseId: caseData.id,
          firmId,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch case data');

      return { caseId: caseData.id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stale-cases'] });
    },
    onError: (error: any) => {
      const message = getInvokeErrorMessage(error);
      console.error('Fetch error:', message);
      toast({
        title: 'Fetch failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Batch fetch function
  const startBatchFetch = async (casesToFetch: StaleCase[]) => {
    if (casesToFetch.length === 0) {
      toast({
        title: "No Cases to Fetch",
        description: "No stale cases with CNR numbers found",
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
        currentCase: caseData.case_number || caseData.case_title,
      });

      try {
        await fetchSingleCase.mutateAsync(caseData);
        successCount++;
        toast({
          title: "Case Updated",
          description: `${caseData.case_number || caseData.case_title}`,
        });
      } catch (error: any) {
        failCount++;
        const message = getInvokeErrorMessage(error);
        toast({
          title: `Failed: ${caseData.case_number || caseData.cnr_number}`,
          description: message,
          variant: 'destructive',
        });
      }

      // Refresh the list after each fetch
      await queryClient.invalidateQueries({ queryKey: ['stale-cases'] });

      // Delay between fetches (2 seconds)
      if (i < casesToFetch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsAutoFetching(false);
    setAutoFetchProgress({ current: 0, total: 0, currentCase: '' });

    if (!stopAutoFetch) {
      toast({
        title: "Fetch Complete",
        description: `Successfully fetched ${successCount} cases. ${failCount > 0 ? `${failCount} failed.` : ''}`,
      });
    }
  };

  // Calculate days overdue
  const getDaysOverdue = (dateStr: string): number => {
    return differenceInDays(new Date(), new Date(dateStr));
  };

  // Filter cases
  const filteredCases = staleCases?.filter(c => {
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

    // Days overdue filter
    if (daysFilter !== "all") {
      const days = getDaysOverdue(c.next_hearing_date);
      if (daysFilter === "7" && days < 7) return false;
      if (daysFilter === "30" && days < 30) return false;
      if (daysFilter === "90" && days < 90) return false;
    }

    // Court type filter
    if (courtTypeFilter !== "all") {
      if (!c.cnr_number) return false;
      const type = detectCourtType(c.cnr_number);
      if (courtTypeFilter === "high_court" && type !== "high_court") return false;
      if (courtTypeFilter === "district_court" && type !== "district_court") return false;
      if (courtTypeFilter === "supreme_court" && type !== "supreme_court") return false;
    }

    return true;
  }) || [];

  // Statistics
  const stats = {
    total: staleCases?.length || 0,
    week: staleCases?.filter(c => getDaysOverdue(c.next_hearing_date) >= 7).length || 0,
    month: staleCases?.filter(c => getDaysOverdue(c.next_hearing_date) >= 30).length || 0,
    readyToFetch: staleCases?.filter(c => c.cnr_number).length || 0,
    noCnr: staleCases?.filter(c => !c.cnr_number).length || 0,
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

  const handleFetchSelected = () => {
    const casesToFetch = filteredCases.filter(c => selectedCases.has(c.id) && c.cnr_number);
    startBatchFetch(casesToFetch);
  };

  const handleFetchAll = () => {
    const casesToFetch = filteredCases.filter(c => c.cnr_number);
    startBatchFetch(casesToFetch);
  };

  const getDaysOverdueBadge = (dateStr: string) => {
    const days = getDaysOverdue(dateStr);
    if (days >= 30) {
      return <Badge variant="error" className="gap-1"><AlertTriangle className="h-3 w-3" />{days} days</Badge>;
    }
    if (days >= 7) {
      return <Badge className="gap-1 bg-amber-500"><Clock className="h-3 w-3" />{days} days</Badge>;
    }
    return <Badge variant="outline" className="gap-1">{days} days</Badge>;
  };

  const getFetchStatusBadge = (caseData: StaleCase) => {
    if (!caseData.cnr_number) {
      return <Badge variant="outline" className="gap-1 text-muted-foreground"><XCircle className="h-3 w-3" />No CNR</Badge>;
    }
    if (caseData.fetch_status === 'success' || caseData.is_auto_fetched) {
      return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Fetched</Badge>;
    }
    if (caseData.fetch_status === 'failed') {
      return <Badge variant="error" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Not Fetched</Badge>;
  };

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader 
          title="Stale Cases" 
          showBack 
          onBack={() => navigate('/hearings')}
        />

        <div className="p-4 space-y-4">
          {/* Stats Strip */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <div className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm w-28">
              <Calendar className="h-5 w-5 text-primary mb-1" />
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm w-28">
              <AlertTriangle className="h-5 w-5 text-amber-500 mb-1" />
              <p className="text-xl font-bold text-amber-600">{stats.week}</p>
              <p className="text-xs text-muted-foreground">1+ Week</p>
            </div>
            <div className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm w-28">
              <AlertTriangle className="h-5 w-5 text-red-500 mb-1" />
              <p className="text-xl font-bold text-red-600">{stats.month}</p>
              <p className="text-xs text-muted-foreground">1+ Month</p>
            </div>
            <div className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm w-28">
              <RefreshCw className="h-5 w-5 text-green-500 mb-1" />
              <p className="text-xl font-bold text-green-600">{stats.readyToFetch}</p>
              <p className="text-xs text-muted-foreground">Ready</p>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {!isAutoFetching ? (
              <Button onClick={handleFetchAll} className="w-full" disabled={stats.readyToFetch === 0}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Fetch All ({stats.readyToFetch})
              </Button>
            ) : (
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching...
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {autoFetchProgress.current}/{autoFetchProgress.total}
                  </span>
                </div>
                <Progress value={(autoFetchProgress.current / autoFetchProgress.total) * 100} className="h-2" />
                <Button variant="destructive" size="sm" className="w-full" onClick={() => setStopAutoFetch(true)}>
                  <StopCircle className="h-4 w-4 mr-2" />Stop
                </Button>
              </div>
            )}
          </div>

          {/* Case Cards */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="font-medium">No Stale Cases</p>
                <p className="text-sm text-muted-foreground">All cases are up to date</p>
              </div>
            ) : (
              filteredCases.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{c.case_title}</p>
                      <p className="text-xs text-muted-foreground">{c.case_number || c.cnr_number}</p>
                    </div>
                    {getDaysOverdueBadge(c.next_hearing_date)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Last: {TimeUtils.formatDate(c.next_hearing_date)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {getFetchStatusBadge(c)}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/cases/${c.id}`)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      {c.cnr_number && (
                        <Button 
                          size="sm" 
                          onClick={() => fetchSingleCase.mutate(c)}
                          disabled={fetchSingleCase.isPending}
                        >
                          {fetchSingleCase.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        
      </div>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/hearings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Stale Cases</h1>
          <p className="text-muted-foreground">Cases with past hearing dates that need updates</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Stale</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.week}</p>
              <p className="text-sm text-muted-foreground">1+ Week Overdue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.month}</p>
              <p className="text-sm text-muted-foreground">1+ Month Overdue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.readyToFetch}</p>
              <p className="text-sm text-muted-foreground">Ready to Fetch</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-500">{stats.noCnr}</p>
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
              <CardTitle>Cases with Past Hearings</CardTitle>
              <CardDescription>
                These cases have hearing dates in the past and may need their data refreshed
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!isAutoFetching ? (
                <>
                  <Button 
                    onClick={() => enableAutoFetchMutation.mutate()} 
                    variant="outline"
                    disabled={enableAutoFetchMutation.isPending}
                  >
                    {enableAutoFetchMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ToggleRight className="mr-2 h-4 w-4" />
                    )}
                    Enable Auto-Fetch (All Pending)
                  </Button>
                  {selectedCases.size > 0 && (
                    <Button onClick={handleFetchSelected} variant="secondary">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Fetch Selected ({selectedCases.size})
                    </Button>
                  )}
                  <Button onClick={handleFetchAll} disabled={stats.readyToFetch === 0}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Fetch All ({stats.readyToFetch})
                  </Button>
                </>
              ) : (
                <Button onClick={() => setStopAutoFetch(true)} variant="destructive">
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Fetching
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          {isAutoFetching && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="font-medium">Fetching Stale Cases...</span>
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

          {/* Filters */}
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
            <Select value={daysFilter} onValueChange={setDaysFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Days Overdue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Overdue</SelectItem>
                <SelectItem value="7">7+ Days Overdue</SelectItem>
                <SelectItem value="30">30+ Days Overdue</SelectItem>
                <SelectItem value="90">90+ Days Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courtTypeFilter} onValueChange={setCourtTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Court Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                <SelectItem value="high_court">High Court</SelectItem>
                <SelectItem value="district_court">District Court</SelectItem>
                <SelectItem value="supreme_court">Supreme Court</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">No Stale Cases</h3>
              <p className="text-muted-foreground">All cases are up to date with their hearing information</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedCases.size > 0 && selectedCases.size === filteredCases.filter(c => c.cnr_number).length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>CNR Number</TableHead>
                    <TableHead>Last Hearing</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Fetch Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedCases.has(c.id)}
                          onCheckedChange={(checked) => handleSelectCase(c.id, !!checked)}
                          disabled={!c.cnr_number}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.case_title}</p>
                          <p className="text-xs text-muted-foreground">{c.case_number}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {c.cnr_number || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {TimeUtils.formatDate(c.next_hearing_date)}
                      </TableCell>
                      <TableCell>
                        {getDaysOverdueBadge(c.next_hearing_date)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.court_name || '—'}
                      </TableCell>
                      <TableCell>
                        {getFetchStatusBadge(c)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/cases/${c.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {c.cnr_number && (
                            <Button 
                              size="sm" 
                              onClick={() => fetchSingleCase.mutate(c)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaleCases;
