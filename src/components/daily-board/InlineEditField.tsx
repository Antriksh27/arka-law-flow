import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InlineEditFieldProps {
  id: string;
  table: 'case_hearings' | 'cases';
  field: string;
  currentValue: string | null;
  onUpdate?: () => void;
  className?: string;
  placeholder?: string;
}

export const InlineEditField: React.FC<InlineEditFieldProps> = ({ 
  id, 
  table,
  field,
  currentValue,
  onUpdate,
  className = '',
  placeholder = '-'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({ [field]: value || null })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Updated',
        description: `${field.replace(/_/g, ' ')} has been updated.`,
      });
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        title: 'Error',
        description: `Failed to update. Please try again.`,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className={`flex items-center gap-1 group min-h-[24px] ${className}`}>
        <span className={`text-sm flex-1 ${currentValue ? 'text-gray-700' : 'text-gray-400'}`}>{currentValue || placeholder}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <Pencil className="h-3 w-3 text-gray-500" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-7 text-sm min-w-[80px]"
        disabled={isSaving}
        autoFocus
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
        className="h-5 w-5 p-0 shrink-0"
      >
        <Check className="h-3 w-3 text-green-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isSaving}
        className="h-5 w-5 p-0 shrink-0"
      >
        <X className="h-3 w-3 text-red-600" />
      </Button>
    </div>
  );
};