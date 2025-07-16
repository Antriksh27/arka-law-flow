
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  organization?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect';
  assigned_lawyer_id?: string;
  address?: string;
  notes?: string;
}

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ClientFormData {
  full_name: string;
  email?: string;
  phone?: string;
  organization?: string;
  address?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect';
  assigned_lawyer_id?: string;
  notes?: string;
}

export const EditClientDialog: React.FC<EditClientDialogProps> = ({
  client,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>();

  // Fetch lawyers for assignment
  const { data: lawyers = [] } = useQuery({
    queryKey: ['lawyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['lawyer', 'partner', 'associate', 'admin', 'junior']);
      
      if (error) throw error;
      
      // Sort to always show "chitrajeet upadhyaya" first
      return data?.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      }) || [];
    },
  });

  // Reset form with client data when client changes
  useEffect(() => {
    if (client) {
      reset({
        full_name: client.full_name,
        email: client.email || '',
        phone: client.phone || '',
        organization: client.organization || '',
        address: client.address || '',
        status: client.status,
        assigned_lawyer_id: client.assigned_lawyer_id || '',
        notes: client.notes || '',
      });
    }
  }, [client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          ...data,
          assigned_lawyer_id: data.assigned_lawyer_id || null,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client's information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Full name is required' })}
            />
            {errors.full_name && (
              <p className="text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
            />
          </div>

          <div>
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              {...register('organization')}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <Label htmlFor="assigned_lawyer_id">Assigned Lawyer</Label>
            <select
              id="assigned_lawyer_id"
              {...register('assigned_lawyer_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a lawyer...</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register('address')}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
