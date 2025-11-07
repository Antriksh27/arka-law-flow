
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
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
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>();

  const type = watch('type');

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

  const onSubmit = async (data: ClientFormData) => {
    try {
      // Check for duplicate clients by email or phone (excluding current client)
      // Only check if email or phone is provided (not empty)
      const trimmedEmail = data.email?.trim();
      const trimmedPhone = data.phone?.trim();
      
      if (trimmedEmail || trimmedPhone) {
        let duplicateQuery = supabase
          .from('clients')
          .select('id, full_name, email, phone')
          .neq('id', client.id);

        // Build OR conditions for email and phone with case-insensitive comparison
        const orConditions = [];
        if (trimmedEmail) {
          orConditions.push(`email.ilike.${trimmedEmail}`);
        }
        if (trimmedPhone) {
          orConditions.push(`phone.eq.${trimmedPhone}`);
        }

        if (orConditions.length > 0) {
          duplicateQuery = duplicateQuery.or(orConditions.join(','));
          const { data: existingClients } = await duplicateQuery;

          if (existingClients && existingClients.length > 0) {
            const duplicate = existingClients[0];
            const matchedByEmail = trimmedEmail && duplicate.email?.toLowerCase() === trimmedEmail.toLowerCase();
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

      const { error } = await supabase
        .from('clients')
        .update({
          ...data,
          email: data.email?.trim() || null, // Allow null for blank email
          phone: data.phone?.trim() || null, // Allow null for blank phone
          type: data.type,
          state: stateName,
          district: districtName,
        })
        .eq('id', client.id);

      if (error) throw error;

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client's information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Client Type */}
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">Basic Information</h3>
            
            <div>
              <Label htmlFor="full_name">{type === 'Organization' ? 'Contact Person Name' : 'Full Name'} *</Label>
              <Input
                id="full_name"
                {...register('full_name', { required: 'Full name is required' })}
                placeholder="Enter full name"
              />
              {errors.full_name && (
                <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
              )}
            </div>
          </div>

          {/* Organization Details - Only for Organization */}
          {type === 'Organization' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">Organization Details</h3>
              
              <div>
                <Label htmlFor="organization">Organization Name *</Label>
                <Input
                  id="organization"
                  {...register('organization', { 
                    required: type === 'Organization' ? 'Organization name is required' : false 
                  })}
                  placeholder="Enter organization/company name"
                />
                {errors.organization && (
                  <p className="text-sm text-red-600 mt-1">{errors.organization.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">
              {type === 'Organization' ? 'Contact Person Details' : 'Contact Details'}
            </h3>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                {...register('phone', { required: 'Phone is required' })}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
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
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">Address Information</h3>

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
          </div>

          {/* Referral Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">Referral Information</h3>

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
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">Additional Notes</h3>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                rows={4}
                placeholder="Additional notes about the client"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
