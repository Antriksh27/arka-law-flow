
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import { EngagementLetterDialog } from './EngagementLetterDialog';

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
  city?: string;
  state?: string;
  district?: string;
  aadhaar_no?: string;
  type: 'Individual' | 'Corporate';
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'new';
  assigned_lawyer_id?: string;
  notes?: string;
  source?: string;
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
  const [showEngagementLetter, setShowEngagementLetter] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
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
    }
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
      // Convert state_id and district_id to state and district names
      const selectedState = states.find(s => s.id === selectedStateId);
      const selectedDistrict = districts.find(d => d.id === data.district);
      
      const clientData = {
        ...data,
        state: selectedState?.name || data.state,
        district: selectedDistrict?.name || data.district,
        assigned_lawyer_id: data.assigned_lawyer_id || null,
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
        description: "Client added successfully. You can now create an engagement letter."
      });
      
      setNewClientId(newClient.id);
      reset();
      setSelectedStateId('');
      setShowAddDistrict(false);
      setNewDistrictName('');
      setShowEngagementLetter(true);
      onSuccess();
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
      <DialogContent className="max-w-full h-screen p-8 bg-slate-50 m-0 rounded-none">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl">Add New Client</DialogTitle>
          <DialogDescription>
            Enter the client's information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input 
                id="full_name" 
                {...register('full_name', { required: 'Full name is required' })} 
                className="mt-2"
              />
              {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                {...register('email')} 
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                {...register('phone')} 
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select 
                id="type" 
                {...register('type')} 
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Individual">Individual</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            <div>
              <Label htmlFor="organization">Company Name</Label>
              <Input 
                id="organization" 
                {...register('organization')} 
                className="mt-2"
                placeholder="Company/Organization name"
              />
            </div>

            <div>
              <Label htmlFor="aadhaar_no">Aadhaar Number</Label>
              <Input 
                id="aadhaar_no" 
                {...register('aadhaar_no')} 
                className="mt-2"
                placeholder="12-digit Aadhaar number"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                {...register('status')} 
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New</option>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <Label htmlFor="assigned_lawyer_id">Assigned Lawyer</Label>
              <select 
                id="assigned_lawyer_id" 
                {...register('assigned_lawyer_id')} 
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a lawyer...</option>
                {lawyers.map(lawyer => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Input 
                id="source" 
                {...register('source')} 
                className="mt-2"
                placeholder="How they found us"
              />
            </div>

            <div>
              <Label htmlFor="referred_by_name">Referred By Name</Label>
              <Input 
                id="referred_by_name" 
                {...register('referred_by_name')} 
                className="mt-2"
                placeholder="Name of referrer"
              />
            </div>

            <div>
              <Label htmlFor="referred_by_phone">Referred By Phone</Label>
              <Input 
                id="referred_by_phone" 
                {...register('referred_by_phone')} 
                className="mt-2"
                placeholder="Phone of referrer"
              />
            </div>
          </div>

          {/* Business Information Section */}
          {watch('type') === 'Corporate' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input 
                    id="designation" 
                    {...register('designation')} 
                    className="mt-2"
                    placeholder="Your designation in the company"
                  />
                </div>

                <div>
                  <Label htmlFor="company_phone">Company Phone</Label>
                  <Input 
                    id="company_phone" 
                    {...register('company_phone')} 
                    className="mt-2"
                    placeholder="Company phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input 
                    id="company_email" 
                    type="email"
                    {...register('company_email')} 
                    className="mt-2"
                    placeholder="Company email address"
                  />
                </div>

                <div>
                  <Label htmlFor="company_address">Company Address</Label>
                  <Input 
                    id="company_address" 
                    {...register('company_address')} 
                    className="mt-2"
                    placeholder="Company address"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                {...register('address')} 
                className="mt-2"
                placeholder="Street address"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                {...register('city')} 
                className="mt-2"
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                {...register('state')}
                onChange={(e) => {
                  const selectedState = states.find(s => s.name === e.target.value);
                  if (selectedState) {
                    setValue('state', e.target.value);
                    setSelectedStateId(selectedState.id);
                    setValue('district', ''); // Reset district when state changes
                  }
                }}
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state.id} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="district">District</Label>
              {showAddDistrict ? (
                <div className="space-y-2 mt-2">
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
                <div className="mt-2">
                  <select
                    id="district"
                    {...register('district')}
                    disabled={!selectedStateId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{!selectedStateId ? "Select state first" : "Select district"}</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                    {selectedStateId && (
                      <option value="add_new">+ Add New District</option>
                    )}
                  </select>
                  {selectedStateId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddDistrict(true)}
                      className="mt-2 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New District
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea 
              id="notes" 
              {...register('notes')} 
              className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              rows={4}
              placeholder="Additional notes about the client"
            />
          </div>

          <DialogFooter className="mt-8 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-4">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {showEngagementLetter && newClientId && (
        <EngagementLetterDialog
          open={showEngagementLetter}
          onClose={() => {
            setShowEngagementLetter(false);
            setNewClientId(null);
          }}
          clientId={newClientId}
          clientName={getValues('full_name') || 'New Client'}
        />
      )}
    </Dialog>
  );
};
