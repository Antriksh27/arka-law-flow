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
import { Checkbox } from '@/components/ui/checkbox';

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
  assigned_lawyer_ids?: string[];
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
  
  const [lawyers, setLawyers] = React.useState<Array<{id: string, full_name: string, role: string}>>([]);
  const [selectedLawyers, setSelectedLawyers] = React.useState<string[]>([]);
  
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
      if (!firmId) {
        console.log('ConvertContactToClientDialog: No firm ID available');
        return;
      }
      
      console.log('ConvertContactToClientDialog: Fetching lawyers for firm:', firmId);
      
      // First, let's check what team members exist
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('firm_id', firmId);
      
      console.log('ConvertContactToClientDialog: Team members:', { teamMembers, teamError });
      
      // Query team members and then get their profile info separately
      const { data: teamMembersData, error: tmError } = await supabase
        .from('team_members')
        .select('user_id, role, full_name')
        .eq('firm_id', firmId)
        .in('role', ['admin', 'lawyer', 'junior', 'paralegal', 'office_staff', 'receptionist']);
      
      console.log('ConvertContactToClientDialog: Team members query result:', { teamMembersData, tmError });
      
      if (teamMembersData && teamMembersData.length > 0) {
        const lawyers = teamMembersData.map(tm => ({
          id: tm.user_id,
          full_name: tm.full_name,
          role: tm.role
        }));
        console.log('ConvertContactToClientDialog: Processed lawyers:', lawyers);
        setLawyers(lawyers);
      } else {
        console.log('ConvertContactToClientDialog: No team members found');
        setLawyers([]);
      }
    };
    
    fetchLawyers();
  }, [firmId]);

  const convertMutation = useMutation({
    mutationFn: async (formData: ConvertContactFormData) => {
      // Validate required data
      if (!firmId || !user?.id) {
        throw new Error('Missing required authentication data');
      }

      // Check if client with this email already exists
      if (formData.email) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('email', formData.email)
          .eq('firm_id', firmId)
          .single();
        
        if (existingClient) {
          throw new Error('A client with this email already exists');
        }
      }

      // Create the new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          organization: formData.organization,
          assigned_lawyer_id: formData.assigned_lawyer_ids?.[0],
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
            assigned_to: formData.assigned_lawyer_ids?.[0],
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

      // Remove the contact from contacts table (transfer complete)
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (deleteError) throw deleteError;

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
    onError: (error: any) => {
      console.error('Error converting contact to client:', error);
      
      // Extract specific error message from different error formats
      let errorMessage = "Failed to convert contact to client. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Conversion Failed",
        description: errorMessage,
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
              <Label>Assigned Lawyers</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {lawyers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lawyers found in your firm</p>
                ) : (
                  lawyers.map((lawyer) => (
                    <div key={lawyer.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lawyer-${lawyer.id}`}
                        checked={selectedLawyers.includes(lawyer.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = checked
                            ? [...selectedLawyers, lawyer.id]
                            : selectedLawyers.filter(id => id !== lawyer.id);
                          setSelectedLawyers(newSelected);
                          setValue('assigned_lawyer_ids', newSelected);
                        }}
                      />
                      <Label 
                        htmlFor={`lawyer-${lawyer.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {lawyer.full_name} ({lawyer.role})
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {selectedLawyers.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedLawyers.length} lawyer(s) selected
                </p>
              )}
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