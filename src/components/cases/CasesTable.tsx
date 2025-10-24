
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
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
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  const {
    data: queryResult,
    isLoading
  } = useQuery({
    queryKey: ['cases-table', searchQuery, statusFilter, typeFilter, assignedFilter, page],
    queryFn: async () => {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's role and firm membership from team_members
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role, firm_id')
        .eq('user_id', user.id)
        .single();

      console.log('Team member data:', teamMember);

      // Check if user is admin, lawyer, or office staff (can see all firm cases)
      const isAdminOrLawyer = teamMember?.role === 'admin' || 
                              teamMember?.role === 'lawyer' || 
                              teamMember?.role === 'office_staff';

      console.log('Fetching cases for user:', user.id, 'isAdminOrLawyer:', isAdminOrLawyer);
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;
      
      let query = supabase.from('cases').select(`
        id,
        case_title,
        petitioner,
        respondent,
        case_type,
        status,
        priority,
        created_at,
        updated_at,
        client_id,
        assigned_to,
        assigned_users,
        clients!client_id(full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

      // Apply role-based filtering
      if (!isAdminOrLawyer) {
        // Non-admin users only see cases they're assigned to
        query = query.or(`assigned_to.eq.${user.id},assigned_users.cs.{${user.id}}`);
      }

      if (searchQuery) {
        query = query.or(`case_title.ilike.%${searchQuery}%,petitioner.ilike.%${searchQuery}%,respondent.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%,cnr_number.ilike.%${searchQuery}%,filing_number.ilike.%${searchQuery}%`);
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
      
      // Transform the data to match the expected structure
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
      
      console.log('Transformed cases:', transformedData);
      
      return {
        cases: transformedData,
        totalCount: count || 0
      };
    }
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'disposed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
    if (role === 'office_staff') {
      navigate(`/staff/cases/${caseId}`);
    } else {
      navigate(`/cases/${caseId}`);
    }
  };

  const cases = queryResult?.cases || [];
  const totalCount = queryResult?.totalCount || 0;

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
              <TableHead className="bg-slate-800 text-white">Case Title</TableHead>
              <TableHead className="bg-slate-800 text-white">Client</TableHead>
              <TableHead className="bg-slate-800 text-white">Type</TableHead>
              <TableHead className="bg-slate-800 text-white">Status</TableHead>
              <TableHead className="bg-slate-800 text-white">Priority</TableHead>
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
                  {caseItem.displayTitle || caseItem.case_title}
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
                {format(new Date(caseItem.updated_at), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(p => p - 1);
                  }}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
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
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={page === pageNum}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && page < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(p => p + 1);
                  }}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
