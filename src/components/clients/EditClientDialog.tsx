
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
  assigned_lawyer_id?: string;
  notes?: string;
  type: string;
  state?: string;
  district?: string;
  city?: string;
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
        assigned_lawyer_id: client.assigned_lawyer_id || '',
        notes: client.notes || '',
        type: clientTypeValue,
        state: client.state || '',
        district: client.district || '',
        city: client.city || '',
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
      // Get state name from selected state ID
      const stateName = selectedState ? states.find(s => s.id === selectedState)?.name : null;
      
      // Get district name from selected district
      const districtName = selectedDistrict || null;

      const { error } = await supabase
        .from('clients')
        .update({
          ...data,
          assigned_lawyer_id: data.assigned_lawyer_id || null,
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
            <Label htmlFor="assigned_lawyer_id">Assigned Lawyer</Label>
            <Select
              value={watch('assigned_lawyer_id') || ''}
              onValueChange={(value) => setValue('assigned_lawyer_id', value)}
            >
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="pincode">PIN Code</Label>
              <Input
                id="pincode"
                {...register('address')}
                placeholder="PIN Code"
                maxLength={6}
              />
            </div>
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
