
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CaseCard } from './CaseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CasesGridProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  assignedFilter: string;
}

export const CasesGrid: React.FC<CasesGridProps> = ({
  searchQuery,
  statusFilter,
  typeFilter,
  assignedFilter
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  const { data: queryResult, isLoading } = useQuery({
    queryKey: ['cases', searchQuery, statusFilter, typeFilter, assignedFilter, page],
    queryFn: async () => {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's role and firm membership
      const { data: userProfile } = await supabase
        .from('profiles')
        .select(`
          role,
          law_firm_members(role, law_firm_id)
        `)
        .eq('id', user.id)
        .single();

      // Check if user is admin or lawyer (can see all firm cases)
      const isAdminOrLawyer = userProfile?.role === 'admin' || 
                              userProfile?.role === 'lawyer' || 
                              userProfile?.role === 'partner' ||
                              userProfile?.role === 'associate' ||
                              userProfile?.role === 'junior';

      // Build query with count
      let query = supabase
        .from('cases')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (!isAdminOrLawyer) {
        query = query.or(`assigned_to.eq.${user.id},assigned_users.cs.{${user.id}}`);
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

      // Apply assigned filter
      if (assignedFilter !== 'all') {
        query = query.eq('assigned_to', assignedFilter);
      }

      // Apply pagination at DB level
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        cases: data || [],
        totalCount: count || 0
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
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

  const setPriorityMutation = useMutation({
    mutationFn: async (caseIds: string[]) => {
      const { error } = await supabase
        .from('cases')
        .update({ priority: 'medium' })
        .in('id', caseIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({
        title: "Priority updated",
        description: `${selectedCases.size} case(s) set to medium priority`,
      });
      setSelectedCases(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update priority",
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

  const handleSetPrioritySelected = () => {
    setPriorityMutation.mutate(Array.from(selectedCases));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No cases found matching your criteria.</p>
      </div>
    );
  }

  return (
    <>
      {selectedCases.size > 0 && (
        <div className="flex items-center justify-between p-4 mb-4 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={cases && cases.length > 0 && selectedCases.size === cases.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedCases.size} case(s) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetPrioritySelected}
              disabled={setPriorityMutation.isPending}
            >
              {setPriorityMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Set Medium Priority
            </Button>
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
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="relative">
            <div className="absolute top-4 left-4 z-10">
              <Checkbox
                checked={selectedCases.has(caseItem.id)}
                onCheckedChange={(checked) => handleSelectCase(caseItem.id, checked as boolean)}
                className="bg-white border-2"
              />
            </div>
            <CaseCard case={caseItem} />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-200">
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
