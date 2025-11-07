import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserPlus, Plus } from 'lucide-react';
import { EngagementLetterDialog } from '@/components/clients/EngagementLetterDialog';
interface ConvertToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}
interface ClientFormData {
  full_name: string;
  email?: string;
  phone?: string;
  organization?: string;
  address?: string;
  pin_code?: string;
  state?: string;
  district?: string;
  type: 'Individual' | 'Corporate';
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'new';
  assigned_lawyer_ids?: string[];
  notes?: string;
  referred_by_name?: string;
  referred_by_phone?: string;
  designation?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
}
export const ConvertToClientDialog = ({
  open,
  onOpenChange,
  contact
}: ConvertToClientDialogProps) => {
  const {
    user,
    firmId
  } = useAuth();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');
  const [showEngagementLetter, setShowEngagementLetter] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<ClientFormData>({
    defaultValues: {
      status: 'lead',
      type: 'Individual'
    }
  });

  // Reset form when contact changes or dialog opens
  useEffect(() => {
    if (contact && open) {
      // Build address from contact fields
      const addressParts = [contact.address_line_1, contact.address_line_2].filter(Boolean);
      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

      // Combine notes
      const combinedNotes = [contact.notes, contact.visit_purpose].filter(Boolean).join('\n\n');
      
      // Use contact.type if available, otherwise fallback to checking organization
      const contactType = contact.type || (contact.organization ? 'Corporate' : 'Individual');
      
      setValue('full_name', contact.name || '');
      setValue('email', contact.email || '');
      setValue('phone', contact.phone || '');
      setValue('organization', contact.organization || '');
      setValue('address', fullAddress);
      setValue('pin_code', contact.pin_code || '');
      setValue('referred_by_name', contact.referred_by_name || '');
      setValue('referred_by_phone', contact.referred_by_phone || '');
      setValue('notes', combinedNotes);
      setValue('type', contactType);
      setValue('status', 'lead');
      
      // Business/Organization fields
      setValue('designation', contact.designation || '');
      setValue('company_address', contact.company_address || '');
      setValue('company_phone', contact.company_phone || '');
      setValue('company_email', contact.company_email || '');
      
      if (contact.state_id) {
        setSelectedStateId(contact.state_id);
      }
    }
  }, [contact, open, setValue]);

  // Fetch states
  const {
    data: states = []
  } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('states').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch districts based on selected state
  const {
    data: districts = []
  } = useQuery({
    queryKey: ['districts', selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const {
        data,
        error
      } = await supabase.from('districts').select('id, name').eq('state_id', selectedStateId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStateId
  });

  // Set district name when districts load
  useEffect(() => {
    if (contact?.district_id && districts.length > 0) {
      const district = districts.find(d => d.id === contact.district_id);
      if (district) {
        setValue('district', district.name);
      }
    }
  }, [districts, contact?.district_id, setValue]);

  // Add district mutation
  const addDistrictMutation = async (districtName: string) => {
    if (!selectedStateId) throw new Error('No state selected');
    const {
      data,
      error
    } = await supabase.from('districts').insert({
      name: districtName,
      state_id: selectedStateId
    }).select('id, name').single();
    if (error) throw error;
    return data;
  };
  const handleAddDistrict = async () => {
    if (!newDistrictName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a district name.",
        variant: "destructive"
      });
      return;
    }
    try {
      const newDistrict = await addDistrictMutation(newDistrictName.trim());
      setValue('district', newDistrict.name);
      setShowAddDistrict(false);
      setNewDistrictName('');
      toast({
        title: "Success",
        description: "District added successfully!"
      });
    } catch (error) {
      console.error('Error adding district:', error);
      toast({
        title: "Error",
        description: "Failed to add district. Please try again.",
        variant: "destructive"
      });
    }
  };
  const onSubmit = async (data: ClientFormData) => {
    try {
      // Check for duplicate clients by email or phone
      if (data.email || data.phone) {
        let duplicateQuery = supabase.from('clients').select('id, full_name, email, phone').eq('firm_id', firmId);
        const orConditions = [];
        if (data.email?.trim()) {
          orConditions.push(`email.eq.${data.email.trim()}`);
        }
        if (data.phone?.trim()) {
          orConditions.push(`phone.eq.${data.phone.trim()}`);
        }
        if (orConditions.length > 0) {
          duplicateQuery = duplicateQuery.or(orConditions.join(','));
          const {
            data: existingClients
          } = await duplicateQuery;
          if (existingClients && existingClients.length > 0) {
            const duplicate = existingClients[0];
            const matchField = duplicate.email === data.email ? 'email' : 'phone';
            const matchValue = matchField === 'email' ? duplicate.email : duplicate.phone;
            toast({
              title: "Duplicate Client",
              description: `A client with this ${matchField} (${matchValue}) already exists: ${duplicate.full_name}`,
              variant: "destructive"
            });
            return;
          }
        }
      }

      // Convert state_id and district_id to state and district names
      const selectedState = states.find(s => s.id === selectedStateId);
      const selectedDistrict = districts.find(d => d.name === data.district);
      
      const clientData = {
        ...data,
        state: selectedState?.name || data.state,
        district: data.district,
        firm_id: firmId,
        created_by: user?.id
      };
      const {
        data: newClient,
        error
      } = await supabase.from('clients').insert([clientData]).select('id, full_name').single();
      if (error) throw error;

      // Delete the contact after successful conversion
      const {
        error: deleteError
      } = await supabase.from('contacts').delete().eq('id', contact.id);
      if (deleteError) {
        console.error('Error deleting contact:', deleteError);
      }
      toast({
        title: "Success",
        description: `${contact.name} has been converted to a client successfully!`
      });
      queryClient.invalidateQueries({
        queryKey: ['contacts']
      });
      queryClient.invalidateQueries({
        queryKey: ['clients']
      });
      setNewClientId(newClient.id);
      reset();
      setSelectedStateId('');
      setShowAddDistrict(false);
      setNewDistrictName('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error converting to client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert contact to client. Please try again.",
        variant: "destructive"
      });
    }
  };
  if (!contact) return null;
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Convert to Client
            </DialogTitle>
            <DialogDescription>
              Review and edit the information before converting to a client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1 overflow-y-auto">
            {/* Client Type Selection */}
            <div>
              <Label>Client Type *</Label>
              <RadioGroup value={watch('type') || 'Individual'} onValueChange={value => setValue('type', value as 'Individual' | 'Corporate')} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Individual" id="individual" />
                  <Label htmlFor="individual" className="font-normal cursor-pointer">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Corporate" id="corporate" />
                  <Label htmlFor="corporate" className="font-normal cursor-pointer">Organization</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="full_name">
                {watch('type') === 'Corporate' ? 'Contact Person Name' : 'Full Name'} *
              </Label>
              <Input id="full_name" {...register('full_name', {
              required: 'Full name is required'
            })} />
              {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>}
            </div>

            {watch('type') === 'Corporate' && <div>
                <Label htmlFor="organization">Organization Name *</Label>
                <Input id="organization" {...register('organization', {
              required: watch('type') === 'Corporate' ? 'Organization name is required' : false
            })} placeholder="Company/Organization name" />
                {errors.organization && <p className="text-sm text-red-600 mt-1">{errors.organization.message}</p>}
              </div>}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" {...register('phone', {
              required: 'Phone is required'
            })} />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
            </div>

            

            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} placeholder="Street address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={selectedStateId} onValueChange={value => {
                setSelectedStateId(value);
                setValue('district', '');
                const stateName = states.find(s => s.id === value)?.name;
                setValue('state', stateName || '');
              }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pin_code">PIN Code</Label>
                <Input id="pin_code" {...register('pin_code')} placeholder="Enter PIN code" />
              </div>
            </div>

            <div>
              <Label htmlFor="district">District</Label>
              {showAddDistrict ? <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Enter new district name" value={newDistrictName} onChange={e => setNewDistrictName(e.target.value)} onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDistrict();
                  }
                }} />
                    <Button type="button" onClick={handleAddDistrict} size="sm">
                      Add
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                  setShowAddDistrict(false);
                  setNewDistrictName('');
                }} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div> : <Select value={watch('district') || ''} onValueChange={value => {
              if (value === 'add_new') {
                setShowAddDistrict(true);
              } else {
                setValue('district', value);
              }
            }} disabled={!selectedStateId}>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedStateId ? "Select state first" : "Select district..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map(district => <SelectItem key={district.id} value={district.name}>
                        {district.name}
                      </SelectItem>)}
                    {selectedStateId && <SelectItem value="add_new" className="border-t">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New District
                        </div>
                      </SelectItem>}
                  </SelectContent>
                </Select>}
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea id="notes" {...register('notes')} className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring" rows={4} placeholder="Additional notes about the client" />
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

      {showEngagementLetter && newClientId && <EngagementLetterDialog open={showEngagementLetter} onClose={() => {
      setShowEngagementLetter(false);
      setNewClientId(null);
    }} clientId={newClientId} clientName={getValues('full_name') || 'New Client'} />}
    </>;
};