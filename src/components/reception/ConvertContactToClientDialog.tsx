import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConvertContactToClientDialogProps {
  contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ConvertContactFormData {
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  organization?: string;
  assigned_lawyer_id?: string;
  case_title?: string;
  case_description?: string;
  case_type?: 'civil' | 'criminal' | 'family' | 'corporate' | 'tax' | 'other' | 'labor' | 'intellectual_property' | 'real_estate' | 'immigration' | 'constitutional';
  estimated_fees?: number;
  payment_terms?: string;
  additional_notes?: string;
}

export const ConvertContactToClientDialog: React.FC<ConvertContactToClientDialogProps> = ({
  contact,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const { user, firmId } = useAuth();
  const queryClient = useQueryClient();
  
  const [lawyers, setLawyers] = React.useState<Array<{id: string, full_name: string}>>([]);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ConvertContactFormData>({
    defaultValues: {
      full_name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      case_type: 'civil',
      additional_notes: contact.notes || ''
    }
  });

  React.useEffect(() => {
    const fetchLawyers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'lawyer');
      
      if (data) {
        setLawyers(data);
      }
    };
    
    fetchLawyers();
  }, []);

  const convertMutation = useMutation({
    mutationFn: async (formData: ConvertContactFormData) => {
      // Create the new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          organization: formData.organization,
          assigned_lawyer_id: formData.assigned_lawyer_id,
          firm_id: firmId,
          status: 'active',
          notes: formData.additional_notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create a case if case details are provided
      let newCase = null;
      if (formData.case_title) {
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .insert({
            title: formData.case_title,
            case_title: formData.case_title,
            description: formData.case_description,
            case_type: formData.case_type,
            client_id: newClient.id,
            assigned_to: formData.assigned_lawyer_id,
            firm_id: firmId,
            created_by: user?.id,
            status: 'open',
            priority: 'medium'
          })
          .select()
          .single();

        if (caseError) throw caseError;
        newCase = caseData;
      }

      // Update the contact as converted
      const { error: contactError } = await supabase
        .from('contacts')
        .update({
          converted_to_client: true,
          converted_client_id: newClient.id,
        })
        .eq('id', contact.id);

      if (contactError) throw contactError;

      return { client: newClient, case: newCase };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.client.full_name} has been converted to a client${data.case ? ' and a case has been created' : ''}`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reception-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error converting contact to client:', error);
      toast({
        title: "Error",
        description: "Failed to convert contact to client. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ConvertContactFormData) => {
    convertMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Contact to Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...register('full_name', { required: 'Full name is required' })}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
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
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register('address')}
              />
            </div>

            <div>
              <Label htmlFor="assigned_lawyer_id">Assigned Lawyer</Label>
              <Select onValueChange={(value) => setValue('assigned_lawyer_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lawyer..." />
                </SelectTrigger>
                <SelectContent>
                  {lawyers.map((lawyer) => (
                    <SelectItem key={lawyer.id} value={lawyer.id}>
                      {lawyer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Case Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Case Information (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="case_title">Case Title</Label>
                <Input
                  id="case_title"
                  {...register('case_title')}
                  placeholder="e.g., Property Dispute Resolution"
                />
              </div>

              <div>
                <Label htmlFor="case_type">Case Type</Label>
                <Select onValueChange={(value) => setValue('case_type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="case_description">Case Description</Label>
              <Textarea
                id="case_description"
                {...register('case_description')}
                placeholder="Brief description of the case..."
                rows={3}
              />
            </div>
          </div>

          {/* Fees Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fees & Payment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated_fees">Estimated Fees (₹)</Label>
                <Input
                  id="estimated_fees"
                  type="number"
                  {...register('estimated_fees', { valueAsNumber: true })}
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  {...register('payment_terms')}
                  placeholder="e.g., 50% advance, 50% on completion"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="additional_notes">Additional Notes</Label>
            <Textarea
              id="additional_notes"
              {...register('additional_notes')}
              placeholder="Any additional notes about the client or case..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Converting...' : 'Convert to Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};