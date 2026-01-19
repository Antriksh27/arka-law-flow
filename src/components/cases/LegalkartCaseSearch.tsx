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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.success ? (
            <div className="space-y-2">
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="font-medium">Error:</p>
              <p>{result.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Legalkart Case Search
          </CardTitle>
          <CardDescription>
            Search for case details using Legalkart API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single">Single Search</TabsTrigger>
              <TabsTrigger value="batch">Batch Search</TabsTrigger>
              <TabsTrigger value="display-board">Display Board</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-type" className="flex items-center gap-2">
                    Search Type
                    {autoDetected && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        Auto-detected
                      </Badge>
                    )}
                  </Label>
                  <Select value={searchType} onValueChange={(val) => { setSearchType(val); setAutoDetected(false); }}>
                    <SelectTrigger>
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
                    <Label>Search Mode</Label>
                    <Select value={searchMode} onValueChange={(val: 'CNR' | 'REGISTRATION') => setSearchMode(val)}>
                      <SelectTrigger>
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
                  <Label htmlFor="cnr">CNR Number</Label>
                  <Input
                    id="cnr"
                    value={cnr}
                    onChange={(e) => setCnr(e.target.value)}
                    placeholder="e.g., GJHC240629522024"
                  />
                </div>
              )}
              
              {/* REGISTRATION mode inputs - show only for Gujarat HC in REGISTRATION mode */}
              {searchType === 'gujarat_high_court' && searchMode === 'REGISTRATION' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case-type">Case Type</Label>
                    <Select value={caseType} onValueChange={setCaseType}>
                      <SelectTrigger>
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
                    <Label htmlFor="case-no">Case Number</Label>
                    <Input
                      id="case-no"
                      value={caseNo}
                      onChange={(e) => setCaseNo(e.target.value)}
                      placeholder="e.g., 15981"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="case-year">Case Year</Label>
                    <Input
                      id="case-year"
                      value={caseYear}
                      onChange={(e) => setCaseYear(e.target.value)}
                      placeholder="e.g., 2017"
                    />
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleSingleSearch}
                disabled={searchCaseMutation.isPending}
                className="w-full"
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
            
            <TabsContent value="batch" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-cnrs">CNR Numbers (one per line)</Label>
                <Textarea
                  id="batch-cnrs"
                  value={batchCnrs}
                  onChange={(e) => setBatchCnrs(e.target.value)}
                  placeholder="Enter CNR numbers, one per line"
                  className="min-h-32"
                />
              </div>
              
              <Button 
                onClick={handleBatchSearch}
                disabled={batchSearchMutation.isPending}
                className="w-full"
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
            
            <TabsContent value="display-board" className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Fetch the latest Gujarat court display board information
                </p>
                <Button 
                  onClick={() => displayBoardMutation.mutate()}
                  disabled={displayBoardMutation.isPending}
                  className="w-full"
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
        </CardContent>
      </Card>

      {/* Search Results */}
      {Object.keys(searchResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(searchResults).map(([key, result]) => (
                <div key={key}>
                  {renderSearchResult(result, key)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Searches */}
      {previousSearches && previousSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previousSearches.map((search) => (
                <div key={search.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{search.search_type}</Badge>
                      <span className="font-medium">{search.cnr_number}</span>
                      <Badge 
                        variant={search.status === 'success' ? 'default' : 'error'}
                      >
                        {search.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(search.created_at).toLocaleString()}
                    </p>
                    {search.error_message && (
                      <p className="text-sm text-red-600 mt-1">{search.error_message}</p>
                    )}
                  </div>
                  
                  {search.response_data && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Data
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Search Result: {search.search_type} - {search.cnr_number}
                          </DialogTitle>
                          <DialogDescription>
                            Searched on {new Date(search.created_at).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                          {JSON.stringify(search.response_data, null, 2)}
                        </pre>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};