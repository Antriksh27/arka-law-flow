import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
interface CasesHeaderProps {
  onAddCase: () => void;
}
export const CasesHeader: React.FC<CasesHeaderProps> = ({
  onAddCase
}) => {
  const {
    role
  } = useAuth();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const isAdmin = role === 'admin';
  const handleBatchUpdatePriority = async () => {
    setIsUpdating(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('batch-update-priority');
      if (error) throw error;
      queryClient.invalidateQueries({
        queryKey: ['cases']
      });
      toast({
        title: "Success",
        description: data.message || "All cases updated to medium priority"
      });
    } catch (error) {
      console.error('Error updating priorities:', error);
      toast({
        title: "Error",
        description: "Failed to update case priorities",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  return <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
        
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && <>
            
            
            <Button onClick={onAddCase} className="bg-slate-800 hover:bg-slate-700">
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </>}
      </div>
    </div>;
};