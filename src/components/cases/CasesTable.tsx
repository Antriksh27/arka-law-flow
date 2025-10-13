
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
interface CasesTableProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  assignedFilter: string;
}
export const CasesTable: React.FC<CasesTableProps> = ({
  searchQuery,
  statusFilter,
  typeFilter,
  assignedFilter
}) => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    data: cases,
    isLoading
  } = useQuery({
    queryKey: ['cases-table', searchQuery, statusFilter, typeFilter, assignedFilter],
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

      // Check if user is admin, lawyer, or office staff (can see all firm cases)
      const isAdminOrLawyer = userProfile?.role === 'admin' || 
                              userProfile?.role === 'lawyer' || 
                              userProfile?.role === 'partner' ||
                              userProfile?.role === 'associate' ||
                              userProfile?.role === 'junior' ||
                              userProfile?.role === 'office_staff';

      console.log('Fetching cases for user:', user.id);
      let query = supabase.from('cases').select(`
        *,
        clients!client_id(full_name),
        profiles!created_by(full_name)
      `).order('created_at', {
        ascending: false
      });

      // Apply role-based filtering
      if (!isAdminOrLawyer) {
        // Non-admin users only see cases they're assigned to
        query = query.or(`assigned_to.eq.${user.id},assigned_users.cs.{${user.id}}`);
      }

      if (searchQuery) {
        query = query.or(`case_title.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,petitioner.ilike.%${searchQuery}%,respondent.ilike.%${searchQuery}%,vs.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%,cnr_number.ilike.%${searchQuery}%,filing_number.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter as any);
      }
      const {
        data,
        error
      } = await query;
      if (error) {
        console.error('Query result:', { data, error });
        throw error;
      }
      console.log('Cases query result:', { data, error });
      
      // Transform the data to match the expected structure
      const transformedData = data?.map((caseItem: any) => {
        // Use the title field as the Case Title
        // If petitioner/respondent exist, we can generate "Petitioner Vs Respondent" format
        let displayTitle = caseItem.title;
        
        if (!displayTitle && caseItem.petitioner && caseItem.respondent) {
          // Fallback: Generate from petitioner/respondent if title is missing
          const cleanPetitioner = caseItem.petitioner.replace(/\s*Advocate[:\s].*/gi, '').trim();
          const cleanRespondent = caseItem.respondent.replace(/\s*Advocate[:\s].*/gi, '').trim();
          displayTitle = `${cleanPetitioner} Vs ${cleanRespondent}`;
        }
        
        return {
          ...caseItem,
          displayTitle,
          client_name: caseItem.clients?.full_name,
          created_by_name: caseItem.profiles?.full_name
        };
      }) || [];
      
      console.log('Transformed cases:', transformedData);
      
      return transformedData;
    }
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
    if (role === 'office_staff') {
      navigate(`/staff/cases/${caseId}`);
    } else {
      navigate(`/cases/${caseId}`);
    }
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
      const { error } = await supabase
        .from("cases")
        .delete()
        .in("id", caseIds);
      
      if (error) throw error;
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
              <TableHead className="bg-slate-800 text-white">Case Title</TableHead>
              <TableHead className="bg-slate-800 text-white">Client</TableHead>
              <TableHead className="bg-slate-800 text-white">Type</TableHead>
              <TableHead className="bg-slate-800 text-white">Status</TableHead>
              <TableHead className="bg-slate-800 text-white">Priority</TableHead>
              <TableHead className="bg-slate-800 text-white">Created By</TableHead>
              <TableHead className="bg-slate-800 text-white">Updated</TableHead>
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
                <TableCell className="font-medium">
                  {caseItem.displayTitle || caseItem.title}
                </TableCell>
              <TableCell>
                {caseItem.client_name || 'No client assigned'}
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
                <span className="capitalize">{caseItem.priority}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-gray-100">
                      {caseItem.created_by_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{caseItem.created_by_name}</span>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(caseItem.updated_at), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
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
