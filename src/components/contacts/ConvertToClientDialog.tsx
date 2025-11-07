import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Building, Mail, Phone } from 'lucide-react';

interface ConvertToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

export const ConvertToClientDialog = ({ open, onOpenChange, contact }: ConvertToClientDialogProps) => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const convertToClientMutation = useMutation({
    mutationFn: async () => {
      if (!contact || !user?.id || !firmId) {
        throw new Error('Missing required data');
      }

      // Check if client with same email/phone already exists
      let existingClientQuery = supabase
        .from('clients')
        .select('id, full_name')
        .eq('firm_id', firmId);

      if (contact.email) {
        existingClientQuery = existingClientQuery.eq('email', contact.email);
      } else if (contact.phone) {
        existingClientQuery = existingClientQuery.eq('phone', contact.phone);
      }

      const { data: existingClients } = await existingClientQuery;

      if (existingClients && existingClients.length > 0) {
        throw new Error(`A client with this ${contact.email ? 'email' : 'phone'} already exists: ${existingClients[0].full_name}`);
      }

      // Fetch state and district names from IDs
      let stateName = null;
      let districtName = null;

      if (contact.state_id) {
        const { data: stateData } = await supabase
          .from('states')
          .select('name')
          .eq('id', contact.state_id)
          .single();
        stateName = stateData?.name || null;
      }

      if (contact.district_id) {
        const { data: districtData } = await supabase
          .from('districts')
          .select('name')
          .eq('id', contact.district_id)
          .single();
        districtName = districtData?.name || null;
      }

      // Create client from contact
      const clientData = {
        full_name: contact.name,
        organization: contact.organization || null,
        email: contact.email || null,
        phone: contact.phone || null,
        address: [contact.address_line_1, contact.address_line_2].filter(Boolean).join(', ') || null,
        state: stateName,
        district: districtName,
        referred_by_name: contact.referred_by_name || null,
        referred_by_phone: contact.referred_by_phone || null,
        notes: contact.notes || null,
        firm_id: firmId,
        created_by: user.id,
        status: 'active' as const,
        type: contact.organization ? 'Business' : 'Individual',
      };

      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        throw clientError;
      }

      // Delete the contact after successful conversion
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (deleteError) {
        console.error('Error deleting contact:', deleteError);
        // Don't throw here as client was created successfully
      }

      return newClient;
    },
    onSuccess: (newClient) => {
      toast({
        title: "Success",
        description: `${contact.name} has been converted to a client successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error converting to client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert contact to client. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convert to Client
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to convert this contact to a client? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{contact.name}</h3>
                {contact.organization && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-3 w-3" />
                    {contact.organization}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-3 w-3" />
                  {contact.email}
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">{contact.notes}</p>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p>This will:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Create a new client record with this contact's information</li>
              <li>Remove this contact from your contacts list</li>
              <li>Allow you to create cases and appointments for this client</li>
            </ul>
          </div>
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
            type="button"
            onClick={() => convertToClientMutation.mutate()}
            disabled={convertToClientMutation.isPending}
          >
            {convertToClientMutation.isPending ? 'Converting...' : 'Convert to Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};