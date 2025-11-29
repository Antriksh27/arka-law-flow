import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ActsSelector } from '@/components/cases/ActsSelector';

interface InlineEditReferenceActsProps {
  caseId: string;
  currentActs: string[];
}

export const InlineEditReferenceActs = ({ caseId, currentActs }: InlineEditReferenceActsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [acts, setActs] = useState<string[]>(currentActs || []);
  const queryClient = useQueryClient();

  const updateActsMutation = useMutation({
    mutationFn: async (newActs: string[]) => {
      const { error } = await supabase
        .from('cases')
        .update({ acts: newActs })
        .eq('id', caseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      toast.success('Reference Acts updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating acts:', error);
      toast.error('Failed to update Reference Acts');
    },
  });

  const handleSave = () => {
    updateActsMutation.mutate(acts);
  };

  const handleCancel = () => {
    setActs(currentActs || []);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <ActsSelector
          value={acts}
          onChange={setActs}
          disabled={updateActsMutation.isPending}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateActsMutation.isPending}
            className="h-8"
          >
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateActsMutation.isPending}
            className="h-8"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        {acts && acts.length > 0 ? (
          <p className="text-sm font-medium text-gray-900">{acts.join(', ')}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No acts specified</p>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-8 w-8 p-0 hover:bg-gray-100"
      >
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  );
};
