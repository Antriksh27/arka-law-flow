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
  const caseTitle = caseData.vs || caseData.title || caseData.case_title || 'Untitled Case';

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
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-foreground">
            {caseTitle}
          </h1>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleDelete}
              disabled={deleteCase.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Invoice
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Action
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  Edit Case
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Generate Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Export Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button onClick={() => setShowEditDialog(true)}>
              Update
            </Button>
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
