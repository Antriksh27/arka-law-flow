
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { defaultQueryConfig } from '@/lib/queryConfig';
import { CaseCard } from './CaseCard';
import { MobileCaseCard } from './MobileCaseCard';
import { SkeletonGrid } from '@/components/ui/skeleton-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { Trash2, Loader2, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CasesGridProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  assignedFilter: string;
  showOnlyMyCases?: boolean;
}

export const CasesGrid: React.FC<CasesGridProps> = ({
  searchQuery,
  statusFilter,
  typeFilter,
  assignedFilter,
  showOnlyMyCases = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  const { data: queryResult, isLoading, isError, error } = useQuery({
    queryKey: ['cases', searchQuery, statusFilter, typeFilter, assignedFilter, showOnlyMyCases, page],
    queryFn: async () => {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's role from team_members
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role, firm_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check if user is admin, lawyer, or office staff (can see all firm cases)
      const isAdminOrLawyer = teamMember?.role === 'admin' || 
                              teamMember?.role === 'lawyer' || 
                              teamMember?.role === 'office_staff';

      // Build query with count and related data
      let query = supabase
        .from('cases')
        .select(`
          *
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

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

      // Apply search filter
      if (searchQuery) {
        query = query.or(`case_title.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%,petitioner.ilike.%${searchQuery}%,respondent.ilike.%${searchQuery}%,vs.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%,cnr_number.ilike.%${searchQuery}%,filing_number.ilike.%${searchQuery}%`);
      }

      // Apply status filter at DB level
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      // Apply type filter
      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter as any);
      }

      // Apply pagination at DB level
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      
      // Sort cases: upcoming hearings (today and future) first, then by hearing date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sortedCases = (data || []).sort((a, b) => {
        const aDate = a.next_hearing_date ? new Date(a.next_hearing_date) : null;
        const bDate = b.next_hearing_date ? new Date(b.next_hearing_date) : null;
        
        const aIsUpcoming = aDate && aDate >= today;
        const bIsUpcoming = bDate && bDate >= today;
        
        // Cases with upcoming hearings come first
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        
        // Both have upcoming hearings: sort by nearest date
        if (aIsUpcoming && bIsUpcoming && aDate && bDate) {
          return aDate.getTime() - bDate.getTime();
        }
        
        // Neither has upcoming: sort by status then created_at
        if (a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1;
        }
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      return {
        cases: sortedCases,
        totalCount: count || 0
      };
    },
    ...defaultQueryConfig,
  });

  const cases = queryResult?.cases || [];
  const totalCount = queryResult?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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
      queryClient.invalidateQueries({ queryKey: ["cases"] });
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
    return (
      <div className="space-y-3">
        {[...Array(isMobile ? 5 : 6)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Couldn't load cases</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">{(error as any)?.message || 'An error occurred'}</p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['cases'] })}
          className="min-h-[44px] rounded-xl"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No cases found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
            ? 'Try adjusting your search or filters to find cases.'
            : 'Create your first case to get started with case management.'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Only show selection UI on desktop */}
      {!isMobile && selectedCases.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 mb-4 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={cases && cases.length > 0 && selectedCases.size === cases.length}
              onCheckedChange={handleSelectAll}
              className="w-5 h-5"
            />
            <span className="text-sm text-muted-foreground">
            {selectedCases.size} case(s) selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={deleteCasesMutation.isPending}
              className="h-11 sm:h-9 w-full sm:w-auto"
            >
              {deleteCasesMutation.isPending ? (
                <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
              )}
              Delete Selected
            </Button>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <SkeletonGrid count={9} />
      ) : (
        <div className={`${isMobile ? 'space-y-3' : 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {cases.map((caseItem) => (
          <div key={caseItem.id} className="relative">
            {/* Only show checkbox on desktop */}
            {!isMobile && (
              <div className="absolute top-5 left-5 z-10">
                <Checkbox
                  checked={selectedCases.has(caseItem.id)}
                  onCheckedChange={(checked) => handleSelectCase(caseItem.id, checked as boolean)}
                  className="bg-white border-2 w-5 h-5"
                />
              </div>
            )}
            {isMobile ? (
              <MobileCaseCard case={caseItem} />
            ) : (
              <CaseCard case={caseItem} />
            )}
          </div>
        ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between gap-3 px-4 py-4 bg-card rounded-2xl shadow-sm border border-border ${isMobile ? 'flex-col' : ''}`}>
          <div className="text-sm text-muted-foreground">
            {isMobile ? `Page ${page} of ${totalPages}` : `Page ${page} of ${totalPages} (Total: ${totalCount} cases)`}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className={`${isMobile ? 'h-11 px-5' : 'h-9 px-4'} rounded-xl`}
            >
              <ChevronLeft className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              <span className="ml-1">Prev</span>
            </Button>
            
            {!isMobile && (
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
                      className="min-w-[36px] h-9 rounded-xl"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className={`${isMobile ? 'h-11 px-5' : 'h-9 px-4'} rounded-xl`}
            >
              <span className="mr-1">Next</span>
              <ChevronRight className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>
          </div>
        </div>
      )}

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
