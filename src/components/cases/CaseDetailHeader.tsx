import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Calendar, FileText, Users, Clock, Plus, Ban, User, Building2, Gavel, Flag, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { AssignLawyerDialog } from './AssignLawyerDialog';
import { EditCaseDialog } from './EditCaseDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface CaseDetailHeaderProps {
  case: any;
}
export const CaseDetailHeader: React.FC<CaseDetailHeaderProps> = ({
  case: caseData
}) => {
  const [showAssignLawyer, setShowAssignLawyer] = useState(false);
  const [showEditCase, setShowEditCase] = useState(false);
  const queryClient = useQueryClient();

  // Fetch assigned lawyers info
  const { data: assignedLawyers } = useQuery({
    queryKey: ['case-lawyers', caseData?.id],
    queryFn: async () => {
      if (!caseData?.assigned_users || caseData.assigned_users.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', caseData.assigned_users);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!caseData?.assigned_users?.length
  });

  // Mutation to update case priority
  const updatePriorityMutation = useMutation({
    mutationFn: async (newPriority: 'low' | 'medium' | 'high') => {
      const { error } = await supabase
        .from('cases')
        .update({ priority: newPriority })
        .eq('id', caseData?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseData?.id] });
      toast.success('Priority updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update priority');
      console.error('Error updating priority:', error);
    }
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_court':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const formatCaseType = (type: string) => {
    if (!type) return 'Not specified';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Use case_title first, then fall back to title
  const caseTitle = caseData?.case_title || caseData?.title || 'Untitled Case';

  // Use court_name first, then fall back to court
  const courtName = caseData?.court_name || caseData?.court || 'Not specified';
  return <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                {caseTitle}
              </h1>
              <Badge className={`${getStatusColor(caseData?.status)} rounded-full`}>
                {caseData?.status === 'in_court' ? 'In Court' : caseData?.status?.replace('_', ' ') || 'Unknown'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatCaseType(caseData?.case_type)}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button 
              size="sm"
              onClick={() => setShowEditCase(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Case
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-red-700 hover:bg-red-600 text-white"
              onClick={() => {
                if (confirm('Are you sure you want to close this case?')) {
                  // Handle case closure
                  console.log('Closing case...');
                }
              }}
            >
              <Ban className="w-4 h-4 mr-2" />
              Close Case
            </Button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium text-gray-900">
                {caseData?.clients?.full_name || 'No client assigned'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Lawyer</p>
              <div className="flex items-center gap-1 mt-1">
                {assignedLawyers && assignedLawyers.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {assignedLawyers.slice(0, 3).map((lawyer, index) => (
                      <Avatar key={lawyer.id} className="w-6 h-6">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {lawyer.full_name?.charAt(0) || 'L'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {assignedLawyers.length > 3 && (
                      <span className="text-xs text-gray-500 ml-1">
                        +{assignedLawyers.length - 3}
                      </span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-6 h-6 p-0 rounded-full border border-dashed border-gray-300 ml-1"
                      onClick={() => setShowAssignLawyer(true)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : caseData?.advocate_name ? (
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-gray-900">{caseData.advocate_name}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-6 h-6 p-0 rounded-full border border-dashed border-gray-300 ml-1"
                      onClick={() => setShowAssignLawyer(true)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-3 py-1 text-sm border border-dashed border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setShowAssignLawyer(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Assign Lawyer
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Flag className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              {caseData?.priority ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                      <div className="flex items-center gap-1">
                        <Badge className={`${getPriorityColor(caseData.priority)} rounded-full text-xs`}>
                          {caseData.priority.charAt(0).toUpperCase() + caseData.priority.slice(1)} Priority
                        </Badge>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem 
                      onClick={() => updatePriorityMutation.mutate('high')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-700 border-red-200 rounded-full text-xs">
                          High Priority
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updatePriorityMutation.mutate('medium')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 rounded-full text-xs">
                          Medium Priority
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updatePriorityMutation.mutate('low')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full text-xs">
                          Low Priority
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                      <div className="flex items-center gap-1 font-medium text-gray-900">
                        Not set
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem 
                      onClick={() => updatePriorityMutation.mutate('high')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-700 border-red-200 rounded-full text-xs">
                          High Priority
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updatePriorityMutation.mutate('medium')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 rounded-full text-xs">
                          Medium Priority
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updatePriorityMutation.mutate('low')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full text-xs">
                          Low Priority
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Next Hearing</p>
              <p className="font-medium text-gray-900">
                {formatDate(caseData?.next_hearing_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Details Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Filed Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(caseData?.filing_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Court</p>
              <p className="font-medium text-gray-900">
                {courtName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Gavel className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Case Number</p>
              <p className="font-medium text-gray-900">
                {caseData?.case_number || caseData?.filing_number || caseData?.registration_number || caseData?.cnr_number || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AssignLawyerDialog
        open={showAssignLawyer}
        onClose={() => setShowAssignLawyer(false)}
        caseId={caseData?.id}
        currentLawyers={caseData?.assigned_users || []}
      />

      <EditCaseDialog
        open={showEditCase}
        onClose={() => setShowEditCase(false)}
        caseId={caseData?.id}
        caseData={caseData}
      />
    </div>;
};