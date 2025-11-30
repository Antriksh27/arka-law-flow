import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InlineEditReliefProps {
  hearingId: string;
  currentValue: string | null;
  onUpdate?: () => void;
}

export const InlineEditRelief: React.FC<InlineEditReliefProps> = ({ 
  hearingId, 
  currentValue,
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('case_hearings')
        .update({ relief: value || null })
        .eq('id', hearingId);

      if (error) throw error;

      toast({
        title: 'Relief updated',
        description: 'The relief has been updated successfully.',
      });
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating relief:', error);
      toast({
        title: 'Error',
        description: 'Failed to update relief. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(currentValue || '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 group">
        <span className="text-sm text-gray-700">{currentValue || '-'}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 text-sm"
        disabled={isSaving}
        autoFocus
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
        className="h-6 w-6 p-0"
      >
        <Check className="h-3 w-3 text-green-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isSaving}
        className="h-6 w-6 p-0"
      >
        <X className="h-3 w-3 text-red-600" />
      </Button>
    </div>
  );
};
