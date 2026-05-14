
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useVirtualizer } from '@tanstack/react-virtual';
import { defaultQueryConfig } from '@/lib/queryConfig';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TimeUtils } from '@/lib/timeUtils';
import { bg, border, text, status } from '@/lib/colors';
import html2pdf from 'html2pdf.js';
import { CaseReportPrintView } from './CaseReportPrintView';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

interface CasesTableProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  assignedFilter: string;
  showOnlyMyCases?: boolean;
  searchFields?: string[];
}
export const CasesTable: React.FC<CasesTableProps> = ({
  searchQuery,
  statusFilter,
  typeFilter,
  assignedFilter,
  showOnlyMyCases = false,
  searchFields = []
}) => {
  const navigate = useNavigate();
  const { role, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [sortField, setSortField] = useState<'created_at' | 'reference_number' | 'case_title'>('reference_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const printViewRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [allCasesForReport, setAllCasesForReport] = useState<any[]>([]);

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    toast({
      title: "Generating PDF Report",
      description: "Preparing all filtered cases. This may take a moment...",
    });

    try {
      // Re-fetch all cases matching filters without pagination for the report
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role, firm_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdminOrLawyer = teamMember?.role === 'admin' || 
                              teamMember?.role === 'lawyer' || 
                              teamMember?.role === 'office_staff';

      let query = supabase.from('cases').select(`
        *,
        clients!client_id(full_name)
      `);

      if (firmId) {
        query = query.eq('firm_id', firmId);
      }

      if (!isAdminOrLawyer || showOnlyMyCases) {
        query = query.contains('assigned_users', [user.id]);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter);
      }

      if (assignedFilter !== 'all') {
        if (assignedFilter === 'unassigned') {
          query = query.is('assigned_users', null);
        } else if (assignedFilter === 'me') {
          query = query.contains('assigned_users', [user.id]);
        } else {
          query = query.contains('assigned_users', [assignedFilter]);
        }
      }

      if (searchQuery) {
        const searchTerm = searchQuery.trim();
        const rangeMatch = searchTerm.match(/^(\d+)-(\d+)$/);
        
        if (rangeMatch) {
          const [, start, end] = rangeMatch;
          query = query.gte('reference_number', start).lte('reference_number', end);
        } else {
          const allFields = ['case_title','petitioner','respondent','case_number','cnr_number','filing_number','reference_number','registration_number'];
          const fields = searchFields && searchFields.length > 0 ? searchFields : allFields;
          const orClause = fields.map((f) => `${f}.ilike.%${searchTerm}%`).join(',');
          query = query.or(orClause);
        }
      }

      const { data: allFilteredData, error: fetchError } = await query.order(sortField, { ascending: sortOrder === 'asc' });

      if (fetchError) throw fetchError;

      setAllCasesForReport(allFilteredData || []);

      // Wait for state to update and print view to be ready
      setTimeout(async () => {
        if (!printViewRef.current) return;
        
        printViewRef.current.classList.remove('hidden');
        printViewRef.current.classList.add('block');

        const options = {
          margin: [10, 10, 10, 10],
          filename: `Case_Report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            logging: false
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        await html2pdf().set(options).from(printViewRef.current).save();
        
        printViewRef.current.classList.add('hidden');
        printViewRef.current.classList.remove('block');
        
        toast({
          title: "Success",
          description: "PDF report generated successfully",
        });
        setIsGeneratingPDF(false);
      }, 500);

    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export failed",
        description: (error as any)?.message || "Could not generate PDF report",
        variant: "destructive"
      });
      setIsGeneratingPDF(false);
    }
  };
  
  const {
    data: queryResult,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['cases-table', searchQuery, searchFields, statusFilter, typeFilter, assignedFilter, showOnlyMyCases, page, sortField, sortOrder, pageSize],
    queryFn: async () => {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's role and firm membership from team_members
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role, firm_id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Team member data:', teamMember);

      // Check if user is admin, lawyer, or office staff (can see all firm cases)
      const isAdminOrLawyer = teamMember?.role === 'admin' || 
                              teamMember?.role === 'lawyer' || 
                              teamMember?.role === 'office_staff';

      console.log('Fetching cases for user:', user.id, 'isAdminOrLawyer:', isAdminOrLawyer, 'showOnlyMyCases:', showOnlyMyCases);
      
      let query = supabase.from('cases').select(`
        id,
        case_title,
        petitioner,
        respondent,
        case_type,
        status,
        stage,
        reference_number,
        registration_number,
        created_at,
        updated_at,
        client_id,
        assigned_to,
        assigned_users,
        cnr_number,
        last_fetched_at,
        clients!client_id(full_name)
      `, { count: 'exact' })
      .order('status', { ascending: true }) // pending comes before disposed alphabetically
      .order(sortField, { ascending: sortOrder === 'asc' });

      // Add firm scoping
      if (teamMember?.firm_id) {
        query = query.eq('firm_id', teamMember.firm_id);
      }

      // Apply "My Cases" filter only when explicitly requested
      if (showOnlyMyCases) {
        // Filter to only cases assigned to current user
        query = query.or(`assigned_to.eq.${user.id},assigned_users.cs.{${user.id}}`);
      }

      // Apply assigned filter (for dropdown)
      if (assignedFilter === 'me') {
        query = query.eq('assigned_to', user.id);
      } else if (assignedFilter === 'unassigned') {
        query = query.is('assigned_to', null);
      } else if (assignedFilter !== 'all') {
        query = query.eq('assigned_to', assignedFilter);
      }

      // Apply search filter - across selected fields (or all if none chosen)
      if (searchQuery) {
        const searchTerm = searchQuery.trim();
        
        // Check for range pattern like "62-93"
        const rangeMatch = searchTerm.match(/^(\d+)-(\d+)$/);
        
        if (rangeMatch) {
          const [, start, end] = rangeMatch;
          // Apply range filter to reference_number
          query = query.gte('reference_number', start).lte('reference_number', end);
        } else {
          // Regular search
          const allFields = ['case_title','petitioner','respondent','case_number','cnr_number','filing_number','reference_number','registration_number'];
          const fields = searchFields && searchFields.length > 0 ? searchFields : allFields;
          const orClause = fields.map((f) => `${f}.ilike.%${searchTerm}%`).join(',');
          query = query.or(orClause);
        }
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter as any);
      }

      // Apply pagination only when not showing all
      if (pageSize !== 'all') {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;
        query = query.range(startIndex, endIndex);
      }

      const {
        data,
        error,
        count
      } = await query;
      if (error) {
        console.error('Query result:', { data, error });
        throw error;
      }
      console.log('Cases query result:', { data, error, count });
      
      const transformedData = data?.map((caseItem: any) => {
        // Prefer the case_title field; fallback to generated "Petitioner Vs Respondent"
        let displayTitle = caseItem.case_title;
        
        if (!displayTitle && caseItem.petitioner && caseItem.respondent) {
          const cleanPetitioner = caseItem.petitioner.replace(/\s*Advocate[:\s].*/gi, '').trim();
          const cleanRespondent = caseItem.respondent.replace(/\s*Advocate[:\s].*/gi, '').trim();
          displayTitle = `${cleanPetitioner} Vs ${cleanRespondent}`;
        }
        
        return {
          ...caseItem,
          displayTitle,
          client_name: caseItem.clients?.full_name
        };
      }) || [];
      
      return {
        cases: transformedData,
        totalCount: count || 0
      };
    },
    ...defaultQueryConfig,
  });
  const getStatusColor = (caseStatus: string) => {
    switch (caseStatus) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'disposed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return `${status.default.bg} ${status.default.text} ${status.default.border}`;
    }
  };

  const getStageBadgeVariant = (stage: string | undefined) => {
    if (!stage) return "default";
    const stageLower = stage.toLowerCase();
    
    if (stageLower.includes('disposed') || stageLower.includes('decided') || stageLower.includes('completed')) {
      return "disposed";
    }
    if (stageLower.includes('hearing') || stageLower.includes('listed') || stageLower.includes('returnable')) {
      return "active";
    }
    if (stageLower.includes('pending') || stageLower.includes('admission') || stageLower.includes('adjourned')) {
      return "warning";
    }
    return "default";
  };
  const formatCaseType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const cases = queryResult?.cases || [];
  const totalCount = queryResult?.totalCount || 0;

  const handleSort = (field: 'created_at' | 'reference_number' | 'case_title') => {
    if (sortField === field) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
    // Reset to first page when sorting changes
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number | 'all') => {
    setPageSize(newSize);
    setPage(1);
    setSelectedCases(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCases(new Set(cases?.map(c => c.id) || []));
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

  const deleteCasesMutation = useMutation({
    mutationFn: async (caseIds: string[]) => {
      const { data, error } = await supabase.rpc('delete_cases_and_dependencies', {
        p_case_ids: caseIds
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases-table"] });
      toast({
        title: "Cases deleted",
        description: `${selectedCases.size} case(s) deleted successfully`,
      });
      setSelectedCases(new Set());
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cases",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSelected = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteCasesMutation.mutate(Array.from(selectedCases));
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading cases...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-red-600 font-medium">Couldn't load cases</div>
        <div className="text-sm text-muted-foreground">{(error as any)?.message || 'Unknown error'}</div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['cases-table'] })}>
          Retry
        </Button>
      </div>
    );
  }

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalCount / (pageSize as number));

  const isAll = pageSize === 'all';
  const sizeOptions: { label: string; value: number | 'all' }[] = [
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: 'All', value: 'all' },
  ];

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-sm border ${border.default}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 border-b border-gray-100">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isGeneratingPDF || isLoading}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2 text-rose-500" />
              )}
              Export PDF
            </Button>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Page Size:</span>
              <Select value={pageSize.toString()} onValueChange={(v) => {
                setPageSize(v === 'all' ? 'all' : parseInt(v));
                setPage(1);
              }}>
                <SelectTrigger className="w-20 h-8 text-xs border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isAll}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium px-2">
                {isAll ? '1 / 1' : `${page} / ${totalPages}`}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isAll}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {selectedCases.size > 0 && (
          <div className={`flex items-center justify-between p-4 border-b ${border.default} ${bg.page}`}>
            <div className="text-sm text-muted-foreground">
              {selectedCases.size} case(s) selected
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={deleteCasesMutation.isPending}
            >
              {deleteCasesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Selected
            </Button>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-slate-800 text-white w-12">
                <Checkbox
                  checked={cases && cases.length > 0 && selectedCases.size === cases.length}
                  onCheckedChange={handleSelectAll}
                  className="border-white"
                />
              </TableHead>
              <TableHead 
                className="bg-slate-800 text-white cursor-pointer hover:bg-slate-700 select-none"
                onClick={() => handleSort('reference_number')}
              >
                <div className="flex items-center gap-2">
                  Reference No
                  {sortField === 'reference_number' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead className="bg-slate-800 text-white">
                Registration No
              </TableHead>
              <TableHead 
                className="bg-slate-800 text-white cursor-pointer hover:bg-slate-700 select-none"
                onClick={() => handleSort('case_title')}
              >
                <div className="flex items-center gap-2">
                  Case Title
                  {sortField === 'case_title' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead className="bg-slate-800 text-white">Client</TableHead>
              <TableHead className="bg-slate-800 text-white">Type</TableHead>
              <TableHead className="bg-slate-800 text-white">Status</TableHead>
              <TableHead className="bg-slate-800 text-white">Stage</TableHead>
              <TableHead
                className="bg-slate-800 text-white cursor-pointer hover:bg-slate-700 select-none"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  Updated
                  {sortField === 'created_at' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases?.map(caseItem => <TableRow key={caseItem.id} className={bg.hover}>
                <TableCell>
                  <Checkbox
                    checked={selectedCases.has(caseItem.id)}
                    onCheckedChange={(checked) => handleSelectCase(caseItem.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {caseItem.reference_number || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {caseItem.registration_number || '-'}
                </TableCell>
                <TableCell 
                  className="font-medium text-primary cursor-pointer hover:underline"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                >
                  {caseItem.displayTitle || caseItem.case_title}
                </TableCell>
              <TableCell>
                {caseItem.client_id ? (
                  <span
                    className="text-primary cursor-pointer hover:underline"
                    onClick={() => navigate(`/clients/${caseItem.client_id}`)}
                  >
                    {caseItem.client_name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No client assigned</span>
                )}
              </TableCell>
              <TableCell>
                {formatCaseType(caseItem.case_type)}
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(caseItem.status)} rounded-full text-xs`}>
                  {caseItem.status?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {caseItem.stage ? (
                  <Badge variant={getStageBadgeVariant(caseItem.stage) as any}>
                    {caseItem.stage}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {TimeUtils.formatDate(caseItem.updated_at, 'MMM d, yyyy')}
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      
      {(totalPages > 1 || isAll) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {isAll ? (
              <span>Showing all {totalCount} cases</span>
            ) : (
              <span>Page {page} of {totalPages} <span className="hidden sm:inline">(Total: {totalCount} cases)</span></span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Page size tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {sizeOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handlePageSizeChange(opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    pageSize === opt.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {!isAll && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="h-11 sm:h-9 px-4"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="ml-1">Prev</span>
                </Button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="min-w-[36px] h-9"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  className="h-11 sm:h-9 px-4"
                >
                  <span className="mr-1">Next</span>
                  <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cases</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCases.size} case(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CaseReportPrintView 
        ref={printViewRef}
        cases={allCasesForReport}
        filters={{
          searchQuery,
          statusFilter,
          typeFilter,
          assignedFilter
        }}
      />
    </>
  );
};
