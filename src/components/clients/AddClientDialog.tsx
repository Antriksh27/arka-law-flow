
import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';

interface AddClientDialogProps {
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
  pin_code?: string;
  state?: string;
  district?: string;
  type: 'Individual' | 'Corporate';
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'new';
  assigned_lawyer_ids?: string[];
  notes?: string;
  referred_by_name?: string;
  referred_by_phone?: string;
  // Business Information
  designation?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
}

export const AddClientDialog: React.FC<AddClientDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user, firmId } = useAuth();
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<ClientFormData>({
    defaultValues: {
      status: 'lead',
      type: 'Individual'
    }
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
      return data;
    },
  });

  // Fetch districts based on selected state
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const { data, error } = await supabase
        .from('districts')
        .select('id, name')
        .eq('state_id', selectedStateId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStateId,
  });

  // Add district mutation
  const addDistrictMutation = async (districtName: string) => {
    if (!selectedStateId) throw new Error('No state selected');
    
    const { data, error } = await supabase
      .from('districts')
      .insert({
        name: districtName,
        state_id: selectedStateId,
      })
      .select('id, name')
      .single();

    if (error) throw error;
    return data;
  };

  const handleAddDistrict = async () => {
    if (!newDistrictName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a district name.",
        variant: "destructive",
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
        description: "District added successfully!",
      });
    } catch (error) {
      console.error('Error adding district:', error);
      toast({
        title: "Error",
        description: "Failed to add district. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      // Check for duplicate clients by email or phone
      if (data.email || data.phone) {
        let duplicateQuery = supabase
          .from('clients')
          .select('id, full_name, email, phone')
          .eq('firm_id', firmId);

        // Build OR conditions for email and phone
        const orConditions = [];
        if (data.email?.trim()) {
          orConditions.push(`email.eq.${data.email.trim()}`);
        }
        if (data.phone?.trim()) {
          orConditions.push(`phone.eq.${data.phone.trim()}`);
        }

        if (orConditions.length > 0) {
          duplicateQuery = duplicateQuery.or(orConditions.join(','));
          const { data: existingClients } = await duplicateQuery;

          if (existingClients && existingClients.length > 0) {
            const duplicate = existingClients[0];
            const matchField = duplicate.email === data.email ? 'email' : 'phone';
            const matchValue = matchField === 'email' ? duplicate.email : duplicate.phone;
            
            toast({
              title: "Duplicate Client",
              description: `A client with this ${matchField} (${matchValue}) already exists: ${duplicate.full_name}`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Convert state_id and district_id to state and district names
      const selectedState = states.find(s => s.id === selectedStateId);
      const selectedDistrict = districts.find(d => d.id === data.district);
      
      const clientData = {
        ...data,
        state: selectedState?.name || data.state,
        district: selectedDistrict?.name || data.district,
        firm_id: firmId,
        created_by: user?.id
      };
      
      // Remove fields that don't exist in the clients table
      delete (clientData as any).district_id;
      delete (clientData as any).state_id;

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client added successfully."
      });
      
      reset();
      setSelectedStateId('');
      setShowAddDistrict(false);
      setNewDistrictName('');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-[700px] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-muted">
          <div className="px-6 py-5 bg-background border-b">
            <DialogHeader className="p-0">
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your client management system.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Type */}
          <div>
            <Label>Client Type *</Label>
            <RadioGroup
              value={watch('type') || 'Individual'}
              onValueChange={(value) => setValue('type', value as 'Individual' | 'Corporate')}
              className="flex gap-4 mt-2"
            >
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">Basic Information</h3>
            
            <div>
              <Label htmlFor="full_name">
                {watch('type') === 'Corporate' ? 'Contact Person Name' : 'Full Name'} *
              </Label>
              <Input 
                id="full_name" 
                {...register('full_name', { required: 'Full name is required' })} 
                placeholder="Enter full name"
              />
              {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>}
            </div>
          </div>

          {/* Organization Details - Only for Corporate */}
          {watch('type') === 'Corporate' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">Organization Details</h3>
              
              <div>
                <Label htmlFor="organization">Organization Name *</Label>
                <Input 
                  id="organization" 
                  {...register('organization', { 
                    required: watch('type') === 'Corporate' ? 'Organization name is required' : false 
                  })} 
                  placeholder="Enter organization/company name"
                />
                {errors.organization && <p className="text-sm text-red-600 mt-1">{errors.organization.message}</p>}
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">
              {watch('type') === 'Corporate' ? 'Contact Person Details' : 'Contact Details'}
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
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status') || 'lead'}
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
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={selectedStateId}
                  onValueChange={(value) => {
                    setSelectedStateId(value);
                    setValue('district', '');
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
              {showAddDistrict ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new district name"
                      value={newDistrictName}
                      onChange={(e) => setNewDistrictName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDistrict();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddDistrict}
                      size="sm"
                    >
                      Add
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDistrict(false);
                        setNewDistrictName('');
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Select
                  value={watch('district') || ''}
                  onValueChange={(value) => {
                    if (value === 'add_new') {
                      setShowAddDistrict(true);
                    } else {
                      setValue('district', value);
                    }
                  }}
                  disabled={!selectedStateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedStateId ? "Select state first" : "Select district..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.name}>
                        {district.name}
                      </SelectItem>
                    ))}
                    {selectedStateId && (
                      <SelectItem value="add_new" className="border-t">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New District
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Business Information - Only for Corporate */}
          {watch('type') === 'Corporate' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3 mb-4">Business Information</h3>

              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input 
                  id="designation" 
                  {...register('designation')} 
                  placeholder="Designation in company"
                />
              </div>

              <div>
                <Label htmlFor="company_phone">Company Phone</Label>
                <Input 
                  id="company_phone" 
                  {...register('company_phone')} 
                  placeholder="Company phone number"
                />
              </div>

              <div>
                <Label htmlFor="company_email">Company Email</Label>
                <Input 
                  id="company_email" 
                  type="email"
                  {...register('company_email')} 
                  placeholder="Company email address"
                />
              </div>

              <div>
                <Label htmlFor="company_address">Company Address</Label>
                <Input 
                  id="company_address" 
                  {...register('company_address')} 
                  placeholder="Company address"
                />
              </div>
            </div>
          )}

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

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Client'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
