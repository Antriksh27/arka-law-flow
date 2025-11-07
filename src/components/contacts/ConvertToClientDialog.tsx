import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus } from 'lucide-react';
import { EngagementLetterDialog } from '@/components/clients/EngagementLetterDialog';
interface ConvertToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}
export const ConvertToClientDialog = ({
  open,
  onOpenChange,
  contact
}: ConvertToClientDialogProps) => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [officeNotes, setOfficeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEngagementLetter, setShowEngagementLetter] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');

  // Fetch states for display
  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('states')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch districts for display
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', contact?.state_id],
    queryFn: async () => {
      if (!contact?.state_id) return [];
      const { data, error } = await supabase
        .from('districts')
        .select('id, name')
        .eq('state_id', contact.state_id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!contact?.state_id
  });

  const stateName = states.find(s => s.id === contact?.state_id)?.name || contact?.state_id;
  const districtName = districts.find(d => d.id === contact?.district_id)?.name || contact?.district_id;

  const handleConvert = async () => {
    if (!contact) return;
    
    setIsSubmitting(true);
    try {
      // Build address from contact fields
      const addressParts = [contact.address_line_1, contact.address_line_2].filter(Boolean);
      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

      // Combine existing notes with office notes
      const existingNotes = [contact.notes, contact.visit_purpose].filter(Boolean).join('\n\n');
      const finalNotes = officeNotes.trim() 
        ? `[OFFICE STAFF ONLY]\n${officeNotes}\n\n${existingNotes}`.trim()
        : existingNotes;

      // Check for duplicate clients
      if (contact.email || contact.phone) {
        let duplicateQuery = supabase
          .from('clients')
          .select('id, full_name, email, phone')
          .eq('firm_id', firmId);

        const orConditions = [];
        if (contact.email?.trim()) {
          orConditions.push(`email.eq.${contact.email.trim()}`);
        }
        if (contact.phone?.trim()) {
          orConditions.push(`phone.eq.${contact.phone.trim()}`);
        }

        if (orConditions.length > 0) {
          duplicateQuery = duplicateQuery.or(orConditions.join(','));
          const { data: existingClients } = await duplicateQuery;

          if (existingClients && existingClients.length > 0) {
            const duplicate = existingClients[0];
            const matchField = duplicate.email === contact.email ? 'email' : 'phone';
            const matchValue = matchField === 'email' ? duplicate.email : duplicate.phone;
            
            toast({
              title: "Duplicate Client",
              description: `A client with this ${matchField} (${matchValue}) already exists: ${duplicate.full_name}`,
              variant: "destructive"
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Create client data
      const clientData = {
        full_name: contact.name,
        email: contact.email || null,
        phone: contact.phone || null,
        organization: contact.organization || null,
        address: fullAddress || null,
        pin_code: contact.pin_code || null,
        state: stateName || null,
        district: districtName || null,
        type: contact.type || (contact.organization ? 'Corporate' : 'Individual'),
        status: 'lead' as const,
        referred_by_name: contact.referred_by_name || null,
        referred_by_phone: contact.referred_by_phone || null,
        designation: contact.designation || null,
        company_address: contact.company_address || null,
        company_phone: contact.company_phone || null,
        company_email: contact.company_email || null,
        notes: finalNotes || null,
        firm_id: firmId,
        created_by: user?.id
      };

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select('id, full_name')
        .single();

      if (error) throw error;

      // Delete the contact after successful conversion
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (deleteError) {
        console.error('Error deleting contact:', deleteError);
      }

      toast({
        title: "Success",
        description: `${contact.name} has been converted to a client successfully!`
      });

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      setNewClientId(newClient.id);
      setNewClientName(newClient.full_name);
      setOfficeNotes('');
      onOpenChange(false);
      setShowEngagementLetter(true);
    } catch (error: any) {
      console.error('Error converting to client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert contact to client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!contact) return null;

  // Build address for display
  const addressParts = [contact.address_line_1, contact.address_line_2].filter(Boolean);
  const displayAddress = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Convert to Client
            </DialogTitle>
            <DialogDescription>
              Review contact information and add office notes before converting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Contact Summary */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3">Contact Information</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{contact.name}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{contact.type || (contact.organization ? 'Corporate' : 'Individual')}</p>
                </div>

                {contact.organization && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Organization</Label>
                    <p className="font-medium">{contact.organization}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{contact.email || 'N/A'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{contact.phone || 'N/A'}</p>
                </div>

                <div className="col-span-2">
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{displayAddress}</p>
                </div>

                {stateName && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">State</Label>
                      <p className="font-medium">{stateName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">District</Label>
                      <p className="font-medium">{districtName || 'N/A'}</p>
                    </div>
                  </>
                )}

                {contact.pin_code && (
                  <div>
                    <Label className="text-muted-foreground">PIN Code</Label>
                    <p className="font-medium">{contact.pin_code}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Office Notes Section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3">
                Office Notes
                <span className="text-xs font-normal text-muted-foreground ml-2">(Visible to Office Staff Only)</span>
              </h3>
              
              <div>
                <Label htmlFor="office-notes">Add Internal Notes</Label>
                <Textarea
                  id="office-notes"
                  value={officeNotes}
                  onChange={(e) => setOfficeNotes(e.target.value)}
                  rows={6}
                  placeholder="Add any internal notes for office staff only. These notes will not be visible to clients..."
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  These notes will be marked as "Office Staff Only" and saved with the client record.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={isSubmitting}>
              {isSubmitting ? 'Converting...' : 'Convert to Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showEngagementLetter && newClientId && (
        <EngagementLetterDialog
          open={showEngagementLetter}
          onClose={() => {
            setShowEngagementLetter(false);
            setNewClientId(null);
          }}
          clientId={newClientId}
          clientName={newClientName}
        />
      )}
    </>
  );
};