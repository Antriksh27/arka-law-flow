import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useIsMobile } from '@/hooks/use-mobile';

interface Field {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: 'text' | 'email' | 'tel';
  maxLength?: number;
  validation?: z.ZodType<any>;
}

interface InlineEditCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: Field[];
  clientId: string;
  clientData: Record<string, any>;
  onUpdate: () => void;
}

export const InlineEditCard: React.FC<InlineEditCardProps> = ({
  title,
  icon: TitleIcon,
  fields,
  clientId,
  clientData,
  onUpdate
}) => {
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleEdit = () => {
    // Initialize edited data with current values
    const initialData: Record<string, string> = {};
    fields.forEach(field => {
      initialData[field.key] = clientData[field.key] || '';
    });
    setEditedData(initialData);
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
    setErrors({});
  };

  const validateField = (field: Field, value: string): string | null => {
    try {
      if (field.validation) {
        field.validation.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Invalid value';
    }
  };

  const handleSave = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, editedData[field.key] || '');
      if (error) {
        newErrors[field.key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      // Prepare update data - only include changed fields
      const updateData: Record<string, string> = {};
      fields.forEach(field => {
        const newValue = editedData[field.key]?.trim() || null;
        if (newValue !== clientData[field.key]) {
          updateData[field.key] = newValue;
        }
      });

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${title} updated successfully`
      });

      setIsEditing(false);
      setEditedData({});
      onUpdate();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client information",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const InfoRow = ({
    field,
    value
  }: {
    field: Field;
    value: string | null | undefined;
  }) => {
    const Icon = field.icon;
    return (
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-slate-400 mt-0.5" />
        <div className="flex-1">
          <span className="text-sm text-slate-600">{field.label}: </span>
          <span className={`text-sm ${value ? 'font-medium text-slate-900' : 'italic text-slate-400'}`}>
            {value || 'Not provided'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TitleIcon className={isMobile ? "w-4 h-4 text-blue-600" : "w-5 h-5 text-blue-600"} />
            <CardTitle className={isMobile ? "text-base" : ""}>{title}</CardTitle>
          </div>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className={isMobile ? "h-9 w-9 p-0" : "h-8 w-8 p-0"}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className={isMobile ? "h-9 w-9 p-0" : "h-8 w-8 p-0"}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className={isMobile ? "h-9 w-9 p-0 bg-green-600 hover:bg-green-700" : "h-8 w-8 p-0 bg-green-600 hover:bg-green-700"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "space-y-3 px-3 pb-3" : "space-y-4"}>
        {isEditing ? (
          fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className={isMobile ? "text-xs font-medium" : "text-sm font-medium"}>
                {field.label}
              </Label>
              <Input
                id={field.key}
                type={field.type || 'text'}
                value={editedData[field.key] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedData(prev => ({ ...prev, [field.key]: value }));
                  // Clear error when user starts typing
                  if (errors[field.key]) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors[field.key];
                      return newErrors;
                    });
                  }
                }}
                maxLength={field.maxLength}
                className={`${errors[field.key] ? 'border-red-500' : ''} ${isMobile ? 'h-10 text-base' : ''}`}
                placeholder={field.label}
              />
              {errors[field.key] && (
                <p className={isMobile ? "text-xs text-red-500" : "text-sm text-red-500"}>{errors[field.key]}</p>
              )}
            </div>
          ))
        ) : (
          fields.map(field => (
            <InfoRow key={field.key} field={field} value={clientData[field.key]} />
          ))
        )}
      </CardContent>
    </Card>
  );
};
