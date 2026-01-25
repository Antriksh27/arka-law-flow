import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, FileText, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

interface LegalkartCaseSearchProps {
  caseId?: string;
  initialCnr?: string;
  onCaseDataFetched?: (data: any) => void;
}

interface SearchResult {
  success: boolean;
  data?: any;
  error?: string;
}

const SEARCH_TYPES = [
  { value: 'high_court', label: 'High Court' },
  { value: 'gujarat_high_court', label: 'Gujarat High Court' },
  { value: 'district_court', label: 'District Court' },
  { value: 'supreme_court', label: 'Supreme Court' },
  { value: 'district_cause_list', label: 'District Court Cause List' },
];

// Gujarat HC Case Types
const GUJARAT_HC_CASE_TYPES = [
  { value: 'SCA', label: 'SCA - Special Civil Application' },
  { value: 'CA', label: 'CA - Civil Application' },
  { value: 'FA', label: 'FA - First Appeal' },
  { value: 'SA', label: 'SA - Second Appeal' },
  { value: 'LPA', label: 'LPA - Letters Patent Appeal' },
  { value: 'CR', label: 'CR - Criminal Revision' },
  { value: 'CRA', label: 'CRA - Criminal Appeal' },
  { value: 'MCA', label: 'MCA - Misc Civil Application' },
  { value: 'AO', label: 'AO - Arbitration Order' },
  { value: 'OP', label: 'OP - Original Petition' },
  { value: 'WP', label: 'WP - Writ Petition' },
  { value: 'RFA', label: 'RFA - Regular First Appeal' },
  { value: 'RCSA', label: 'RCSA - Regular Civil Second Appeal' },
  { value: 'TCA', label: 'TCA - Tax Appeal' },
];

// Auto-detect court type from CNR pattern
const detectCourtTypeFromCNR = (cnr: string): string | null => {
  if (!cnr || cnr.length < 4) return null;
  
  const prefix = cnr.substring(0, 4).toUpperCase();
  
  // Gujarat High Court pattern - GJHC
  if (prefix === 'GJHC') return 'gujarat_high_court';
  
  // Other High Court patterns
  if (prefix.match(/^[A-Z]{2}HC/)) return 'high_court';
  
  // Supreme Court patterns
  if (prefix.match(/^SCSL|^SC[A-Z]{2}|^SCIN/)) return 'supreme_court';
  
  // District Court patterns (usually 4 letters followed by numbers)
  if (prefix.match(/^[A-Z]{4}/) && !prefix.match(/HC|SC/)) return 'district_court';
  
  return null;
};

export const LegalkartCaseSearch: React.FC<LegalkartCaseSearchProps> = ({
  caseId,
  initialCnr = '',
  onCaseDataFetched,
}) => {
  const { toast } = useToast();
  const [cnr, setCnr] = useState(initialCnr);
  const [searchType, setSearchType] = useState<string>('high_court');
  const [batchCnrs, setBatchCnrs] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, SearchResult>>({});
  const [autoDetected, setAutoDetected] = useState(false);
  
  // Gujarat HC REGISTRATION mode state
  const [searchMode, setSearchMode] = useState<'CNR' | 'REGISTRATION'>('CNR');
  const [caseType, setCaseType] = useState('');
  const [caseNo, setCaseNo] = useState('');
  const [caseYear, setCaseYear] = useState('');

  // Auto-detect court type when CNR changes
  useEffect(() => {
    const detected = detectCourtTypeFromCNR(cnr);
    if (detected && detected !== searchType) {
      setSearchType(detected);
      setAutoDetected(true);
    } else if (!detected) {
      setAutoDetected(false);
    }
  }, [cnr]);

  // Fetch previous searches for this case
  const { data: previousSearches, refetch: refetchSearches } = useQuery({
    queryKey: ['legalkart-searches', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from('legalkart_case_searches')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });

  // Single case search mutation
  const searchCaseMutation = useMutation({
    mutationFn: async ({ 
      cnr, 
      searchType, 
      caseMode, 
      caseType, 
      caseNo, 
      caseYear 
    }: { 
      cnr?: string; 
      searchType: string; 
      caseMode?: 'CNR' | 'REGISTRATION';
      caseType?: string;
      caseNo?: string;
      caseYear?: string;
    }) => {
      const invokePromise = supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'search',
          cnr: cnr || undefined,
          searchType,
          caseId,
          caseMode: caseMode === 'REGISTRATION' ? 'REGISTRATION' : undefined,
          caseType: caseMode === 'REGISTRATION' ? caseType : undefined,
          caseNo: caseMode === 'REGISTRATION' ? caseNo : undefined,
          caseYear: caseMode === 'REGISTRATION' ? caseYear : undefined,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Search timed out. Please retry.')), 30000);
      });

      const { data, error } = (await Promise.race([
        invokePromise,
        timeoutPromise,
      ])) as { data: any; error: any };

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      const key = variables.caseMode === 'REGISTRATION' 
        ? `${variables.caseType}/${variables.caseNo}/${variables.caseYear}-${variables.searchType}`
        : `${variables.cnr}-${variables.searchType}`;
      setSearchResults(prev => ({
        ...prev,
        [key]: data,
      }));

      // Log API Response for debugging
      console.log('📦 Legalkart API Response:', JSON.stringify(data, null, 2));

      if (data.success) {
        toast({
          title: "Search Successful",
          description: `Case data retrieved and stored successfully`,
        });
        
        if (onCaseDataFetched && data.data) {
          onCaseDataFetched(data.data);
        }
      } else {
        toast({
          title: "Search Failed",
          description: data.error || "Failed to retrieve case data",
          variant: "destructive",
        });
      }
      
      refetchSearches();
    },
    onError: (error) => {
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Batch search mutation
  const batchSearchMutation = useMutation({
    mutationFn: async (cnrs: string[]) => {
      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: { 
          action: 'batch_search', 
          cnrs 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Batch Search Completed",
          description: `Processed ${data.processed} CNRs`,
        });
        
        // Update search results
        const newResults: Record<string, SearchResult> = {};
        data.results.forEach((result: any) => {
          const key = `${result.cnr}-${result.searchType}`;
          newResults[key] = {
            success: result.success,
            data: result.data,
            error: result.error,
          };
        });
        
        setSearchResults(prev => ({ ...prev, ...newResults }));
      } else {
        toast({
          title: "Batch Search Failed",
          description: data.error || "Failed to process batch search",
          variant: "destructive",
        });
      }
      
      refetchSearches();
    },
    onError: (error) => {
      toast({
        title: "Batch Search Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gujarat Display Board mutation
  const displayBoardMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: { action: 'gujarat_display_board' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setSearchResults(prev => ({
          ...prev,
          'gujarat-display-board': data,
        }));
        toast({
          title: "Display Board Fetched",
          description: "Gujarat display board data retrieved successfully",
        });
      } else {
        toast({
          title: "Display Board Failed",
          description: data.error || "Failed to fetch display board",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Display Board Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSingleSearch = () => {
    // REGISTRATION mode validation
    if (searchMode === 'REGISTRATION' && searchType === 'gujarat_high_court') {
      if (!caseType || !caseNo || !caseYear) {
        toast({
          title: "Missing Fields",
          description: "Please fill Case Type, Case Number, and Year for REGISTRATION mode search",
          variant: "destructive",
        });
        return;
      }
      
      searchCaseMutation.mutate({ 
        searchType, 
        caseMode: 'REGISTRATION',
        caseType,
        caseNo,
        caseYear
      });
      return;
    }

    // CNR mode validation
    if (!cnr.trim()) {
      toast({
        title: "CNR Required",
        description: "Please enter a CNR number to search",
        variant: "destructive",
      });
      return;
    }

    // Validate CNR format (without hyphens)
    const cnrPattern = /^[A-Z]{2,4}[A-Z0-9\d]{8,}$/i;
    if (!cnrPattern.test(cnr.trim())) {
      toast({
        title: "Invalid CNR Format",
        description: "CNR should be in format like: GJHC240629522024 (without hyphens)",
        variant: "destructive",
      });
      return;
    }

    searchCaseMutation.mutate({ cnr: cnr.trim(), searchType });
  };

  const handleBatchSearch = () => {
    const cnrList = batchCnrs
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (cnrList.length === 0) {
      toast({
        title: "CNRs Required",
        description: "Please enter CNR numbers for batch search",
        variant: "destructive",
      });
      return;
    }

    batchSearchMutation.mutate(cnrList);
  };

  const renderSearchResult = (result: SearchResult, title: string) => {
    if (!result) return null;

    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-semibold text-foreground">{title}</span>
          </div>
          {result.success ? (
            <pre className="bg-slate-50 p-4 rounded-xl overflow-auto text-sm max-h-96 border border-slate-100">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          ) : (
            <div className="text-red-600 bg-red-50 p-3 rounded-xl">
              <p className="font-medium">Error:</p>
              <p>{result.error}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Search Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Search className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Legalkart Case Search</h3>
              <p className="text-xs text-muted-foreground">Search for case details using Legalkart API</p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="single" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Single</TabsTrigger>
              <TabsTrigger value="batch" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Batch</TabsTrigger>
              <TabsTrigger value="display-board" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Display</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-type" className="flex items-center gap-2 text-sm font-medium text-foreground">
                    Search Type
                    {autoDetected && (
                      <Badge variant="outline" className="text-xs gap-1 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Auto-detected
                      </Badge>
                    )}
                  </Label>
                  <Select value={searchType} onValueChange={(val) => { setSearchType(val); setAutoDetected(false); }}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                      <SelectValue placeholder="Select search type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEARCH_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Show search mode selector only for Gujarat High Court */}
                {searchType === 'gujarat_high_court' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Search Mode</Label>
                    <Select value={searchMode} onValueChange={(val: 'CNR' | 'REGISTRATION') => setSearchMode(val)}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                        <SelectValue placeholder="Select search mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNR">CNR Number</SelectItem>
                        <SelectItem value="REGISTRATION">Registration (Case Type/No/Year)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* CNR input - show only when in CNR mode or not Gujarat HC */}
              {(searchType !== 'gujarat_high_court' || searchMode === 'CNR') && (
                <div className="space-y-2">
                  <Label htmlFor="cnr" className="text-sm font-medium text-foreground">CNR Number</Label>
                  <Input
                    id="cnr"
                    value={cnr}
                    onChange={(e) => setCnr(e.target.value)}
                    placeholder="e.g., GJHC240629522024"
                    className="bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                </div>
              )}
              
              {/* REGISTRATION mode inputs - show only for Gujarat HC in REGISTRATION mode */}
              {searchType === 'gujarat_high_court' && searchMode === 'REGISTRATION' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case-type" className="text-sm font-medium text-foreground">Case Type</Label>
                    <Select value={caseType} onValueChange={setCaseType}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                        <SelectValue placeholder="Select case type" />
                      </SelectTrigger>
                      <SelectContent>
                        {GUJARAT_HC_CASE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="case-no" className="text-sm font-medium text-foreground">Case Number</Label>
                    <Input
                      id="case-no"
                      value={caseNo}
                      onChange={(e) => setCaseNo(e.target.value)}
                      placeholder="e.g., 15981"
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="case-year" className="text-sm font-medium text-foreground">Case Year</Label>
                    <Input
                      id="case-year"
                      value={caseYear}
                      onChange={(e) => setCaseYear(e.target.value)}
                      placeholder="e.g., 2017"
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleSingleSearch}
                disabled={searchCaseMutation.isPending}
                className="w-full rounded-xl h-11"
              >
                {searchCaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Case
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="batch-cnrs" className="text-sm font-medium text-foreground">CNR Numbers (one per line)</Label>
                <Textarea
                  id="batch-cnrs"
                  value={batchCnrs}
                  onChange={(e) => setBatchCnrs(e.target.value)}
                  placeholder="Enter CNR numbers, one per line"
                  className="min-h-32 bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>
              
              <Button 
                onClick={handleBatchSearch}
                disabled={batchSearchMutation.isPending}
                className="w-full rounded-xl h-11"
              >
                {batchSearchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Batch...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Batch Search
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="display-board" className="space-y-4 mt-4">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Fetch the latest Gujarat court display board information
                </p>
                <Button 
                  onClick={() => displayBoardMutation.mutate()}
                  disabled={displayBoardMutation.isPending}
                  className="w-full rounded-xl h-11"
                >
                  {displayBoardMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching Display Board...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Get Gujarat Display Board
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Search Results */}
      {Object.keys(searchResults).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Search Results</h3>
            </div>
          </div>
          <div className="p-4">
            {Object.entries(searchResults).map(([key, result]) => (
              <div key={key}>
                {renderSearchResult(result, key)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Searches */}
      {previousSearches && previousSearches.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-violet-500" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Previous Searches</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {previousSearches.map((search) => (
              <div key={search.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="rounded-full">{search.search_type}</Badge>
                    <span className="font-medium text-foreground">{search.cnr_number}</span>
                    <Badge 
                      className={`rounded-full border-0 ${search.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {search.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(search.created_at).toLocaleString()}
                  </p>
                  {search.error_message && (
                    <p className="text-sm text-red-600 mt-1">{search.error_message}</p>
                  )}
                </div>
                
                {search.response_data && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-full">
                        View Data
                      </Button>
                    </DialogTrigger>
                    <DialogContent hideCloseButton className="sm:max-w-4xl max-h-[80vh] overflow-auto p-0 bg-slate-50">
                      <div className="p-6 bg-white border-b border-slate-100">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">
                            Search Result: {search.search_type} - {search.cnr_number}
                          </DialogTitle>
                          <DialogDescription>
                            Searched on {new Date(search.created_at).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>
                      </div>
                      <div className="p-6">
                        <pre className="bg-white p-4 rounded-xl overflow-auto text-sm border border-slate-100">
                          {JSON.stringify(search.response_data, null, 2)}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};