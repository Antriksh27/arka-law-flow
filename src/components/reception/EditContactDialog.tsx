import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

interface ContactFormData {
  name: string;
  email?: string;
  phone?: string;
  visit_purpose?: string;
  address?: string;
  pin_code?: string;
  notes?: string;
}

const EditContactDialog: React.FC<EditContactDialogProps> = ({ open, onOpenChange, contact }) => {
  const { user, firmId } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>();

  // Load contact data into form when contact changes
  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        visit_purpose: contact.visit_purpose || '',
        address: contact.address || '',
        pin_code: contact.pin_code || '',
        notes: contact.notes || ''
      });
    }
  }, [contact, reset]);

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!contact?.id) throw new Error('Contact ID is required');
      
      const { error } = await supabase
        .from('contacts')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          visit_purpose: data.visit_purpose || null,
          address: data.address || null,
          pin_code: data.pin_code || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contact updated successfully');
      queryClient.invalidateQueries({ queryKey: ['reception-recent-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onOpenChange(false);
      reset();
    },
    onError: (error) => {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    }
  });

  const onSubmit = (data: ContactFormData) => {
    updateContactMutation.mutate(data);
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 m-0 rounded-none">
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update the contact information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit_purpose">Purpose of Visit</Label>
            <Input
              id="visit_purpose"
              {...register('visit_purpose')}
              placeholder="Enter purpose of visit"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin_code">PIN Code</Label>
            <Input
              id="pin_code"
              {...register('pin_code')}
              placeholder="Enter PIN code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateContactMutation.isPending}
            >
              {updateContactMutation.isPending ? 'Updating...' : 'Update Contact'}
            </Button>
          </DialogFooter>
        </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditContactDialog;