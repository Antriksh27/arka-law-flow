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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  referred_by_name?: string;
  referred_by_phone?: string;
  is_vip?: boolean;
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
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const isMobile = useIsMobile();
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);
  const [clientType, setClientType] = useState<string>('Individual');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isVip, setIsVip] = useState<boolean>(false);
  
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
      setIsVip(client.is_vip || false);
      
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
          is_vip: isVip,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      
      handleClose();
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


  const formView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Edit Client"
        subtitle="Update the client's information below."
        onClose={handleClose}
      />
      <ScrollArea className="flex-1">
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Client Type */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50">
              <Label className="text-sm font-semibold text-foreground mb-3 block">Client Type *</Label>
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
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              
              <div>
                <Label htmlFor="full_name" className="text-xs text-slate-500 mb-1">{type === 'Organization' ? 'Contact Person Name' : 'Full Name'} *</Label>
                <Input
                  id="full_name"
                  {...register('full_name', { required: 'Full name is required' })}
                  placeholder="Enter full name"
                  className="rounded-xl bg-slate-50 border-0 h-11"
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                )}
              </div>
            </div>

            {/* Organization Details - Only for Organization */}
            {type === 'Organization' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Organization Details</h3>
                
                <div>
                  <Label htmlFor="organization" className="text-xs text-slate-500 mb-1">Organization Name *</Label>
                  <Input
                    id="organization"
                    {...register('organization', { 
                      required: type === 'Organization' ? 'Organization name is required' : false 
                    })}
                    placeholder="Enter organization/company name"
                    className="rounded-xl bg-slate-50 border-0 h-11"
                  />
                  {errors.organization && (
                    <p className="text-sm text-red-600 mt-1">{errors.organization.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Contact Details */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                {type === 'Organization' ? 'Contact Person Details' : 'Contact Details'}
              </h3>

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
                    {...register('phone', { required: 'Phone is required' })}
                    placeholder="Enter phone number"
                    className="rounded-xl bg-slate-50 border-0 h-11"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="status" className="text-xs text-slate-500 mb-1">Status</Label>
                <Select
                  value={watch('status') || 'active'}
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

              <div className="flex items-center justify-between p-4 border border-border/50 rounded-2xl bg-accent/5">
                <div className="flex-1">
                  <Label htmlFor="vip-toggle" className="text-sm font-medium">VIP Client</Label>
                  <p className="text-xs text-muted-foreground mt-1">Mark this client as a VIP for priority handling</p>
                </div>
                <Switch
                  id="vip-toggle"
                  checked={isVip}
                  onCheckedChange={setIsVip}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Address Information</h3>

              <div>
                <Label htmlFor="address" className="text-xs text-slate-500 mb-1">Address</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Street address, building, etc."
                  className="rounded-xl bg-slate-50 border-0 h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state" className="text-xs text-slate-500 mb-1">State</Label>
                  <Select
                    value={selectedState}
                    onValueChange={(value) => {
                      setSelectedState(value);
                      setSelectedDistrict('');
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
                    {...register('pin_code')}
                    placeholder="Enter PIN code"
                    className="rounded-xl bg-slate-50 border-0 h-11"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="district" className="text-xs text-slate-500 mb-1">District</Label>
                <Select
                  value={selectedDistrict}
                  onValueChange={(value) => {
                    setSelectedDistrict(value);
                    setValue('district', value);
                  }}
                  disabled={!selectedState}
                >
                  <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11">
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
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Referral Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="referred_by_name" className="text-xs text-slate-500 mb-1">Reference Name</Label>
                  <Input
                    id="referred_by_name"
                    {...register('referred_by_name')}
                    placeholder="Name of referrer"
                    className="rounded-xl bg-slate-50 border-0 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="referred_by_phone" className="text-xs text-slate-500 mb-1">Reference Contact</Label>
                  <Input
                    id="referred_by_phone"
                    {...register('referred_by_phone')}
                    placeholder="Contact count"
                    className="rounded-xl bg-slate-50 border-0 h-11"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4 mb-20">
              <h3 className="text-sm font-semibold text-foreground">Additional Notes</h3>

              <div>
                <Label htmlFor="notes" className="text-xs text-slate-500 mb-1">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  rows={4}
                  placeholder="Additional notes about the client"
                  className="rounded-xl bg-slate-50 border-0"
                />
              </div>
            </div>

            {/* Standard Footer within Form */}
            <div className="pt-4 sticky bottom-0 bg-white border-t border-slate-100 px-6 pb-6 pt-4 mt-6 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 rounded-full h-12 shadow-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  {isSubmitting ? 'Updating...' : 'Update Client'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </ScrollArea>
    </div>
  );

  if (isInsideDialog) {
    return formView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-[700px] p-0 gap-0 overflow-hidden bg-slate-50 h-[95vh] sm:h-auto">
        {formView}
      </DialogContent>
    </Dialog>
  );
};
