import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  
  const [clientType, setClientType] = useState<'Individual' | 'Corporate'>('Individual');
  const [status, setStatus] = useState<'active' | 'lead' | 'prospect' | 'inactive'>('active');
  const [assignedLawyerId, setAssignedLawyerId] = useState<string>('');
  const [designation, setDesignation] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Fetch lawyers from the firm
  const { data: lawyers = [] } = useQuery({
    queryKey: ['firm-lawyers', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, profiles:user_id(id, full_name)')
        .eq('firm_id', firmId)
        .in('role', ['admin', 'lawyer'])
        .order('profiles(full_name)');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId && open,
  });

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

      // Build address with pin code if available
      const addressParts = [contact.address_line_1, contact.address_line_2].filter(Boolean);
      if (contact.pin_code) {
        addressParts.push(`PIN: ${contact.pin_code}`);
      }
      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

      // Combine notes
      const combinedNotes = [contact.notes, contact.visit_purpose, additionalNotes]
        .filter(Boolean)
        .join('\n\n');

      // Create client from contact
      const clientData = {
        full_name: contact.name,
        organization: contact.organization || null,
        email: contact.email || null,
        phone: contact.phone || null,
        address: fullAddress,
        state: stateName,
        district: districtName,
        referred_by_name: contact.referred_by_name || null,
        referred_by_phone: contact.referred_by_phone || null,
        notes: combinedNotes || null,
        firm_id: firmId,
        created_by: user.id,
        status: status,
        type: clientType,
        assigned_lawyer_id: assignedLawyerId || null,
        designation: clientType === 'Corporate' ? designation || null : null,
        company_address: clientType === 'Corporate' ? companyAddress || null : null,
        company_phone: clientType === 'Corporate' ? companyPhone || null : null,
        company_email: clientType === 'Corporate' ? companyEmail || null : null,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convert to Client
          </DialogTitle>
          <DialogDescription>
            Please provide additional details to complete the client profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-medium">{contact.name}</h3>
                {contact.organization && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {contact.organization}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {contact.email}
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </div>
              )}
            </div>
          </div>

          {/* Client Type */}
          <div className="space-y-2">
            <Label htmlFor="client-type">Client Type *</Label>
            <Select value={clientType} onValueChange={(value: 'Individual' | 'Corporate') => setClientType(value)}>
              <SelectTrigger id="client-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assign Lawyer */}
          <div className="space-y-2">
            <Label htmlFor="lawyer">Assign Lawyer</Label>
            <Select value={assignedLawyerId} onValueChange={setAssignedLawyerId}>
              <SelectTrigger id="lawyer">
                <SelectValue placeholder="Select a lawyer" />
              </SelectTrigger>
              <SelectContent>
                {lawyers.map((lawyer: any) => (
                  <SelectItem key={lawyer.user_id} value={lawyer.user_id}>
                    {lawyer.profiles?.full_name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Corporate Fields */}
          {clientType === 'Corporate' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm">Corporate Details</h4>
              
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g., Managing Director"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-address">Company Address</Label>
                <Textarea
                  id="company-address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Company address"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-phone">Company Phone</Label>
                <Input
                  id="company-phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="Company phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-email">Company Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="company@example.com"
                />
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additional-notes">Additional Notes</Label>
            <Textarea
              id="additional-notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any additional information about this client..."
              rows={3}
            />
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