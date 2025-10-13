
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
import { Trash2, Loader2 } from 'lucide-react';
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
  
  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases', searchQuery, statusFilter, typeFilter, assignedFilter],
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

      let query = supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (!isAdminOrLawyer) {
        // Non-admin users only see cases they're assigned to
        query = query.or(`assigned_to.eq.${user.id},assigned_users.cs.{${user.id}}`);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,case_title.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%,petitioner.ilike.%${searchQuery}%,respondent.ilike.%${searchQuery}%,vs.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%,cnr_number.ilike.%${searchQuery}%,filing_number.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

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
      // Delete in batches of 50 to avoid URL length limits
      const batchSize = 50;
      for (let i = 0; i < caseIds.length; i += batchSize) {
        const batch = caseIds.slice(i, i + batchSize);
        const { error } = await supabase
          .from("cases")
          .delete()
          .in("id", batch);
        
        if (error) throw error;
      }
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
