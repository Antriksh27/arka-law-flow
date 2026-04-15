
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Plus, User, Building2, Phone, MapPin, FileText, Settings, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';

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
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);
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
      handleClose();
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive"
      });
    }
  };


  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client Type */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50">
        <Label className="text-sm font-semibold text-slate-900 mb-3 block">Client Type *</Label>
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
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
            <User className="w-4 h-4 text-sky-500" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Basic Information</span>
        </div>
        
        <div>
          <Label htmlFor="full_name" className="text-xs text-slate-500 mb-1">
            {watch('type') === 'Corporate' ? 'Contact Person Name' : 'Full Name'} *
          </Label>
          <Input 
            id="full_name" 
            {...register('full_name', { required: 'Full name is required' })} 
            placeholder="Enter full name"
            className="rounded-xl bg-slate-50 border-0 h-11"
          />
          {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>}
        </div>

        {watch('type') === 'Corporate' && (
          <div>
            <Label htmlFor="organization" className="text-xs text-slate-500 mb-1">Organization Name *</Label>
            <Input 
              id="organization" 
              {...register('organization', { 
                required: watch('type') === 'Corporate' ? 'Organization name is required' : false 
              })} 
              placeholder="Enter organization/company name"
              className="rounded-xl bg-slate-50 border-0 h-11"
            />
            {errors.organization && <p className="text-sm text-red-600 mt-1">{errors.organization.message}</p>}
          </div>
        )}
      </div>

      {/* Contact Details */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Phone className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {watch('type') === 'Corporate' ? 'Contact Details' : 'Contact Details'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="text-xs text-slate-500 mb-1">Email</Label>
            <Input 
              id="email" 
              type="email" 
              {...register('email')} 
              placeholder="Enter email address"
              className="rounded-xl bg-slate-50 border-0 h-11"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-xs text-slate-500 mb-1">Phone *</Label>
            <Input 
              id="phone" 
              type="tel"
              inputMode="numeric"
              {...register('phone', { required: 'Phone is required' })} 
              placeholder="Enter phone number"
              className="rounded-xl bg-slate-50 border-0 h-11"
            />
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="status" className="text-xs text-slate-500 mb-1">Status</Label>
          <Select
            value={watch('status') || 'lead'}
            onValueChange={(value: any) => setValue('status', value)}
          >
            <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11">
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
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Address Information</span>
        </div>

        <div>
          <Label htmlFor="address" className="text-xs text-slate-500 mb-1">Address</Label>
          <Input 
            id="address" 
            {...register('address')} 
            placeholder="Street address"
            className="rounded-xl bg-slate-50 border-0 h-11"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="state" className="text-xs text-slate-500 mb-1">State</Label>
            <Select
              value={selectedStateId}
              onValueChange={(value) => {
                setSelectedStateId(value);
                setValue('district', '');
                const stateName = states.find(s => s.id === value)?.name;
                setValue('state', stateName || '');
              }}
            >
              <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11">
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
            <Label htmlFor="pin_code" className="text-xs text-slate-500 mb-1">PIN Code</Label>
            <Input 
              id="pin_code" 
              type="text"
              inputMode="numeric"
              {...register('pin_code')} 
              placeholder="Enter PIN code"
              className="rounded-xl bg-slate-50 border-0 h-11"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="district" className="text-xs text-slate-500 mb-1">District</Label>
          {showAddDistrict ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new district name"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  className="rounded-xl bg-slate-50 border-0 h-11"
                />
                <Button type="button" onClick={handleAddDistrict} size="sm">Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDistrict(false)} size="sm">Cancel</Button>
              </div>
            </div>
          ) : (
            <Select
              value={watch('district') || ''}
              onValueChange={(value) => {
                if (value === 'add_new') setShowAddDistrict(true);
                else setValue('district', value);
              }}
              disabled={!selectedStateId}
            >
              <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11">
                <SelectValue placeholder={!selectedStateId ? "Select state first" : "Select district..."} />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.id} value={district.name}>{district.name}</SelectItem>
                ))}
                {selectedStateId && (
                  <SelectItem value="add_new" className="border-t">Add New District</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4 pb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Notes & Reference</span>
        </div>

        <div>
          <Label htmlFor="referred_by_name" className="text-xs text-slate-500 mb-1">Reference Name</Label>
          <Input id="referred_by_name" {...register('referred_by_name')} placeholder="Name of person who referred" className="rounded-xl bg-slate-50 border-0 h-11 mb-4" />
          
          <Label htmlFor="referred_by_phone" className="text-xs text-slate-500 mb-1">Reference Contact</Label>
          <Input id="referred_by_phone" type="tel" inputMode="numeric" {...register('referred_by_phone')} placeholder="Contact number of referrer" className="rounded-xl bg-slate-50 border-0 h-11 mb-4" />

          <Label htmlFor="notes" className="text-xs text-slate-500 mb-1">Notes</Label>
          <Textarea id="notes" {...register('notes')} rows={4} placeholder="Additional notes about the client" className="rounded-xl bg-slate-50 border-0" />
        </div>
      </div>

        <DialogFooter className="pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl">{isSubmitting ? 'Adding...' : 'Add Client'}</Button>
        </DialogFooter>
    </form>
  );

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Add New Client"
        subtitle="Fill in the details below to register a new client."
        onClose={handleClose}
      />
      <ScrollArea className="flex-1">
        <div className="px-6 py-6">
          {formContent}
        </div>
      </ScrollArea>
      <div className="p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3 sticky bottom-0 z-10 sm:hidden">
        <Button type="button" className="flex-1 rounded-2xl h-12" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
          {isSubmitting ? 'Adding...' : 'Add Client'}
        </Button>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-[700px] p-0 gap-0 overflow-hidden bg-slate-50 h-[95vh] sm:h-auto">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};
