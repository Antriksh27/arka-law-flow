
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
  const [sortField, setSortField] = useState<'created_at' | 'reference_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 20;
  
  const {
    data: queryResult,
    isLoading
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
        reference_number,
        created_at,
        updated_at,
        client_id,
        assigned_to,
        assigned_users,
        cnr_number,
        last_fetched_at,
        clients!client_id(full_name)
      `, { count: 'exact' })
      .order(sortField, { ascending: sortOrder === 'asc' })
      .range(startIndex, endIndex);

      // Apply role-based filtering or My Cases filter
      if (showOnlyMyCases || !isAdminOrLawyer) {
        // Filter to only cases assigned to current user
        query = query.or(`assigned_to.eq.${user.id},assigned_users.cs.{${user.id}}`);
      }

      if (searchQuery) {
        query = query.or(`case_title.ilike.%${searchQuery}%,petitioner.ilike.%${searchQuery}%,respondent.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%,cnr_number.ilike.%${searchQuery}%,filing_number.ilike.%${searchQuery}%,reference_number.ilike.%${searchQuery}%`);
      }
      // Note: Status filter applied after data transformation to work with displayStatus
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
      
      // Transform the data to match the expected structure
      const mapToLegalkartStatus = (text?: string | null) => {
        const s = (text || '').toLowerCase();
        if (!s) return 'in_court';
        if (
          s.includes('disposed') || s.includes('dismiss') || s.includes('withdraw') ||
          s.includes('decid') || s.includes('complete') || s.includes('settled') || s.includes('close')
        ) {
          return 'disposed';
        }
        return 'in_court';
      };

      const transformedData = data?.map((caseItem: any) => {
        // Prefer the case_title field; fallback to generated "Petitioner Vs Respondent"
        let displayTitle = caseItem.case_title;
        
        if (!displayTitle && caseItem.petitioner && caseItem.respondent) {
          const cleanPetitioner = caseItem.petitioner.replace(/\s*Advocate[:\s].*/gi, '').trim();
          const cleanRespondent = caseItem.respondent.replace(/\s*Advocate[:\s].*/gi, '').trim();
          displayTitle = `${cleanPetitioner} Vs ${cleanRespondent}`;
        }
        
        // Determine display status: if linked to Legalkart, map to pending/disposed; otherwise show actual status
        const isLinkedToLegalkart = caseItem.cnr_number && caseItem.last_fetched_at;
        const displayStatus = isLinkedToLegalkart 
          ? mapToLegalkartStatus(caseItem.status)
          : caseItem.status || 'open';
        
        return {
          ...caseItem,
          displayTitle,
          displayStatus,
          client_name: caseItem.clients?.full_name
        };
      }) || [];
      
      // Apply status filter after transformation to work with displayStatus
      const filteredData = statusFilter !== 'all' 
        ? transformedData.filter(c => c.displayStatus === statusFilter)
        : transformedData;
      
      console.log('Transformed and filtered cases:', filteredData);
      
      return {
        cases: filteredData,
        totalCount: statusFilter !== 'all' ? filteredData.length : count || 0
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
  const formatCaseType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const handleCaseClick = (caseId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox
    if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
      return;
    }
    navigate(`/cases/${caseId}`);
  };

  const cases = queryResult?.cases || [];
  const totalCount = queryResult?.totalCount || 0;

  const handleSort = (field: 'created_at' | 'reference_number') => {
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
              <TableHead className="bg-slate-800 text-white">Case Title</TableHead>
              <TableHead className="bg-slate-800 text-white">Client</TableHead>
              <TableHead className="bg-slate-800 text-white">Type</TableHead>
              <TableHead className="bg-slate-800 text-white">Status</TableHead>
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
            {cases?.map(caseItem => <TableRow key={caseItem.id} className="cursor-pointer hover:bg-gray-50" onClick={(e) => handleCaseClick(caseItem.id, e)}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedCases.has(caseItem.id)}
                    onCheckedChange={(checked) => handleSelectCase(caseItem.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {caseItem.reference_number || '-'}
                </TableCell>
                <TableCell className="font-medium">
                  {caseItem.displayTitle || caseItem.case_title}
                </TableCell>
              <TableCell>
                {caseItem.client_name || 'No client assigned'}
              </TableCell>
              <TableCell>
                {formatCaseType(caseItem.case_type)}
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(caseItem.displayStatus)} rounded-full text-xs`}>
                  {caseItem.displayStatus?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {TimeUtils.formatDate(caseItem.updated_at, 'MMM d, yyyy')}
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages} (Total: {totalCount} cases)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="hidden sm:flex"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            
            <div className="flex items-center gap-1">
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
                    className="min-w-[32px]"
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
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="hidden sm:flex"
            >
              Last
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
