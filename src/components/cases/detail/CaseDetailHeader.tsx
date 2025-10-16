import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditCaseDialog } from '../EditCaseDialog';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface CaseDetailHeaderProps {
  caseData: any;
  legalkartData?: any;
}

export const CaseDetailHeader: React.FC<CaseDetailHeaderProps> = ({
  caseData,
  legalkartData
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get case title - prefer VS format
  const caseTitle = caseData.vs || caseData.case_title || 'Untitled Case';

  const deleteCase = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Case deleted successfully');
      navigate('/cases');
    },
    onError: () => {
      toast.error('Failed to delete case');
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      deleteCase.mutate();
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937]">
              {caseTitle}
            </h1>
            <p className="text-[#6B7280] mt-1">
              Status: <span className={`${
                caseData.status === 'open' ? 'text-green-600' : 
                caseData.status === 'closed' ? 'text-gray-600' : 
                'text-blue-600'
              }`}>{caseData.status || 'Open'}</span> | 
              Next Hearing: <span className="font-semibold text-[#1F2937]">
                {caseData.next_hearing_date ? new Date(caseData.next_hearing_date).toLocaleDateString() : 'Not scheduled'}
              </span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  Edit Case
                </DropdownMenuItem>
                <DropdownMenuItem>Generate Report</DropdownMenuItem>
                <DropdownMenuItem>Invoice</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={handleDelete}
                >
                  Delete Case
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <EditCaseDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        caseId={caseData.id}
        caseData={caseData}
      />
    </>
  );
};
