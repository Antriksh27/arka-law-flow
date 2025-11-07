
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  organization?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'new';
  assigned_lawyer_id?: string;
  address?: string;
  notes?: string;
  type?: string;
  state?: string;
  district?: string;
  city?: string;
  referred_by_name?: string;
  referred_by_phone?: string;
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
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'new';
  assigned_lawyer_ids?: string[];
  notes?: string;
  type: string;
  state?: string;
  district?: string;
  pin_code?: string;
  referred_by_name?: string;
  referred_by_phone?: string;
}

export const EditClientDialog: React.FC<EditClientDialogProps> = ({
  client,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [clientType, setClientType] = useState<string>('Individual');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedLawyers, setSelectedLawyers] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>();

  const type = watch('type');

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

  // Fetch states
  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('states')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch districts based on selected state
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      
      const { data, error } = await supabase
        .from('districts')
        .select('id, name')
        .eq('state_id', selectedState)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedState,
  });

  // Reset form with client data when client changes
  useEffect(() => {
    if (client) {
      const clientTypeValue = client.type || 'Individual';
      setClientType(clientTypeValue);
      
      reset({
        full_name: client.full_name,
        email: client.email || '',
        phone: client.phone || '',
        organization: client.organization || '',
        address: client.address || '',
        status: client.status,
        notes: client.notes || '',
        type: clientTypeValue,
        state: client.state || '',
        district: client.district || '',
        referred_by_name: client.referred_by_name || '',
        referred_by_phone: client.referred_by_phone || '',
      });

      // Find and set state ID if state name exists
      if (client.state && states.length > 0) {
        const stateObj = states.find(s => s.name === client.state);
        if (stateObj) {
          setSelectedState(stateObj.id);
        }
      }
      
      // Set district name for later matching
      if (client.district) {
        setSelectedDistrict(client.district);
      }
    }
  }, [client, reset, states]);

  // Fetch existing lawyer assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!client?.id) return;
      
      const { data } = await supabase
        .from('client_lawyer_assignments')
        .select('lawyer_id')
        .eq('client_id', client.id);
      
      if (data) {
        const lawyerIds = data.map(a => a.lawyer_id);
        setSelectedLawyers(lawyerIds);
      }
    };
    
    fetchAssignments();
  }, [client?.id]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      // Check for duplicate clients by email or phone (excluding current client)
      if (data.email || data.phone) {
        let duplicateQuery = supabase
          .from('clients')
          .select('id, full_name, email, phone')
          .neq('id', client.id);

        // Build OR conditions for email and phone with case-insensitive comparison
        const orConditions = [];
        if (data.email?.trim()) {
          orConditions.push(`email.ilike.${data.email.trim()}`);
        }
        if (data.phone?.trim()) {
          orConditions.push(`phone.eq.${data.phone.trim()}`);
        }

        if (orConditions.length > 0) {
          duplicateQuery = duplicateQuery.or(orConditions.join(','));
          const { data: existingClients } = await duplicateQuery;

          if (existingClients && existingClients.length > 0) {
            const duplicate = existingClients[0];
            const matchedByEmail = data.email && duplicate.email?.toLowerCase() === data.email.toLowerCase();
            const matchField = matchedByEmail ? 'email' : 'phone';
            const matchValue = matchField === 'email' ? duplicate.email : duplicate.phone;
            
            toast({
              title: "Duplicate Client",
              description: `Another client "${duplicate.full_name}" already has this ${matchField}: ${matchValue}`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Get state name from selected state ID
      const stateName = selectedState ? states.find(s => s.id === selectedState)?.name : null;
      
      // Get district name from selected district
      const districtName = selectedDistrict || null;

      // Set primary lawyer (first selected) as assigned_lawyer_id
      const primaryLawyerId = selectedLawyers.length > 0 ? selectedLawyers[0] : null;

      const { error } = await supabase
        .from('clients')
        .update({
          ...data,
          assigned_lawyer_id: primaryLawyerId,
          type: data.type,
          state: stateName,
          district: districtName,
        })
        .eq('id', client.id);

      if (error) throw error;

      // Update lawyer assignments
      // First, delete existing assignments
      await supabase
        .from('client_lawyer_assignments')
        .delete()
        .eq('client_id', client.id);

      // Then create new assignments
      if (selectedLawyers.length > 0) {
        const { data: firmData } = await supabase
          .from('clients')
          .select('firm_id')
          .eq('id', client.id)
          .single();

        if (firmData) {
          const assignments = selectedLawyers.map(lawyerId => ({
            client_id: client.id,
            lawyer_id: lawyerId,
            firm_id: firmData.firm_id
          }));
          
          await supabase
            .from('client_lawyer_assignments')
            .insert(assignments);
        }
      }

      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error updating client:', error);
      
      // Handle specific database errors
      if (error?.code === '23505') {
        // Unique constraint violation
        if (error?.message?.includes('clients_email_key')) {
          toast({
            title: "Duplicate Email",
            description: "This email address is already registered to another client. Please use a different email.",
            variant: "destructive",
          });
        } else if (error?.message?.includes('clients_phone_key')) {
          toast({
            title: "Duplicate Phone",
            description: "This phone number is already registered to another client. Please use a different phone number.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Duplicate Entry",
            description: "A client with this information already exists. Please check the email or phone number.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update client. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client's information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Client Type *</Label>
            <RadioGroup
              value={type || 'Individual'}
              onValueChange={(value) => {
                setValue('type', value);
                setClientType(value);
              }}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Individual" id="individual" />
                <Label htmlFor="individual" className="font-normal cursor-pointer">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Organization" id="organization" />
                <Label htmlFor="organization" className="font-normal cursor-pointer">Organization</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="full_name">{type === 'Organization' ? 'Contact Person Name' : 'Full Name'} *</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Full name is required' })}
            />
            {errors.full_name && (
              <p className="text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          {type === 'Organization' && (
            <div>
              <Label htmlFor="organization">Organization Name *</Label>
              <Input
                id="organization"
                {...register('organization', { 
                  required: type === 'Organization' ? 'Organization name is required' : false 
                })}
              />
              {errors.organization && (
                <p className="text-sm text-red-600">{errors.organization.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              {...register('phone', { required: 'Phone is required' })}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status') || 'active'}
              onValueChange={(value: any) => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Street address, building, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state">State</Label>
              <Select
                value={selectedState}
                onValueChange={(value) => {
                  setSelectedState(value);
                  setSelectedDistrict('');
                  const stateName = states.find(s => s.id === value)?.name;
                  setValue('state', stateName || '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state..." />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pin_code">PIN Code</Label>
              <Input
                id="pin_code"
                {...register('pin_code')}
                placeholder="Enter PIN code"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="district">District</Label>
            <Select
              value={selectedDistrict}
              onValueChange={(value) => {
                setSelectedDistrict(value);
                setValue('district', value);
              }}
              disabled={!selectedState}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedState ? "Select district..." : "Select state first"} />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.id} value={district.name}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assigned Lawyers</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
              {lawyers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lawyers available</p>
              ) : (
                lawyers.map(lawyer => (
                  <div key={lawyer.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`lawyer-${lawyer.id}`}
                      checked={selectedLawyers.includes(lawyer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLawyers([...selectedLawyers, lawyer.id]);
                        } else {
                          setSelectedLawyers(selectedLawyers.filter(id => id !== lawyer.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    <Label htmlFor={`lawyer-${lawyer.id}`} className="font-normal cursor-pointer">
                      {lawyer.full_name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="referred_by_name">Reference Name</Label>
            <Input
              id="referred_by_name"
              {...register('referred_by_name')}
              placeholder="Name of person who referred"
            />
          </div>

          <div>
            <Label htmlFor="referred_by_phone">Reference Contact</Label>
            <Input
              id="referred_by_phone"
              {...register('referred_by_phone')}
              placeholder="Contact number of referrer"
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
