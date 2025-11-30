
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
import { Trash2, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TimeUtils } from '@/lib/timeUtils';
interface CasesTableProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  assignedFilter: string;
  showOnlyMyCases?: boolean;
}
export const CasesTable: React.FC<CasesTableProps> = ({
  searchQuery,
  statusFilter,
  typeFilter,
  assignedFilter,
  showOnlyMyCases = false
}) => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<'created_at' | 'reference_number' | 'case_title' | 'client_name'>('reference_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const pageSize = 20;
  
  const {
    data: queryResult,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['cases-table', searchQuery, statusFilter, typeFilter, assignedFilter, showOnlyMyCases, page, sortField, sortOrder],
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
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;
      
      let query = supabase.from('cases').select(`
        id,
        case_title,
        petitioner,
        respondent,
        case_type,
        status,
        stage,
        court,
        reference_number,
        created_at,
        updated_at,
        client_id,
        assigned_to,
        assigned_users,
        cnr_number,
        last_fetched_at,
        clients!client_id(full_name)
      `, { count: 'exact' });
      
      // Handle sorting - client_name requires special handling
      if (sortField === 'client_name') {
        // For client sorting, we need to sort by the joined field
        query = query.order('clients.full_name', { ascending: sortOrder === 'asc', nullsFirst: false });
      } else {
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
      }
      
      query = query.range(startIndex, endIndex);

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

      if (searchQuery) {
        query = query.or(`case_title.ilike.%${searchQuery}%,petitioner.ilike.%${searchQuery}%,respondent.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%,cnr_number.ilike.%${searchQuery}%,filing_number.ilike.%${searchQuery}%,reference_number.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter as any);
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'disposed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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

  const handleSort = (field: 'created_at' | 'reference_number' | 'case_title' | 'client_name') => {
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {selectedCases.size > 0 && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
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
              <TableHead 
                className="bg-slate-800 text-white cursor-pointer hover:bg-slate-700 select-none"
                onClick={() => handleSort('client_name')}
              >
                <div className="flex items-center gap-2">
                  Client
                  {sortField === 'client_name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead className="bg-slate-800 text-white">Court Forum</TableHead>
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
            {cases?.map(caseItem => <TableRow key={caseItem.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    checked={selectedCases.has(caseItem.id)}
                    onCheckedChange={(checked) => handleSelectCase(caseItem.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {caseItem.reference_number || '-'}
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
              <TableCell className="text-sm">
                {caseItem.court || '-'}
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
      
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Page {page} of {totalPages} <span className="hidden sm:inline">(Total: {totalCount} cases)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
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
    </>
  );
};
