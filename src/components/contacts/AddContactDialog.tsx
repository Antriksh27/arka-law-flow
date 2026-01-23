import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus, X, User, Building2, Mail, Phone, MapPin, UserCheck, FileText, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ContactFormData {
  name: string;
  type: 'Individual' | 'Organization';
  organization?: string;
  email?: string;
  phone?: string;
  visit_purpose?: string;
  notes?: string;
  address_line_1?: string;
  address_line_2?: string;
  pin_code?: string;
  state_id?: string;
  district_id?: string;
  referred_by_name?: string;
  referred_by_phone?: string;
  designation?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
}

export const AddContactDialog = ({
  open,
  onOpenChange
}: AddContactDialogProps) => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');

  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase.from('states').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['districts', selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const { data, error } = await supabase.from('districts').select('id, name').eq('state_id', selectedStateId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStateId
  });

  const form = useForm<ContactFormData>({
    defaultValues: {
      name: '',
      type: 'Individual',
      organization: '',
      email: '',
      phone: '',
      visit_purpose: '',
      notes: '',
      address_line_1: '',
      address_line_2: '',
      pin_code: '',
      state_id: '',
      district_id: '',
      referred_by_name: '',
      referred_by_phone: '',
      designation: '',
      company_address: '',
      company_phone: '',
      company_email: ''
    }
  });

  const addDistrictMutation = useMutation({
    mutationFn: async (districtName: string) => {
      if (!selectedStateId) throw new Error('No state selected');
      const { data, error } = await supabase.from('districts').insert({
        name: districtName,
        state_id: selectedStateId
      }).select('id, name').single();
      if (error) throw error;
      return data;
    },
    onSuccess: newDistrict => {
      queryClient.invalidateQueries({ queryKey: ['districts', selectedStateId] });
      form.setValue('district_id', newDistrict.id);
      setShowAddDistrict(false);
      setNewDistrictName('');
      toast({ title: "Success", description: "District added successfully!" });
    },
    onError: error => {
      console.error('Error adding district:', error);
      toast({ title: "Error", description: "Failed to add district. Please try again.", variant: "destructive" });
    }
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!data.name?.trim()) throw new Error('Name is required');
      if (!firmId) throw new Error('User is not associated with a firm');
      if (!user?.id) throw new Error('User is not authenticated');

      const cleanedData = {
        name: data.name.trim(),
        type: data.type,
        organization: data.organization?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        visit_purpose: data.visit_purpose?.trim() || null,
        address_line_1: data.address_line_1?.trim() || null,
        address_line_2: data.address_line_2?.trim() || null,
        pin_code: data.pin_code?.trim() || null,
        referred_by_name: data.referred_by_name?.trim() || null,
        referred_by_phone: data.referred_by_phone?.trim() || null,
        notes: data.notes?.trim() || null,
        state_id: data.state_id && data.state_id.trim() ? data.state_id : null,
        district_id: data.district_id && data.district_id.trim() ? data.district_id : null,
        designation: data.designation?.trim() || null,
        company_address: data.company_address?.trim() || null,
        company_phone: data.company_phone?.trim() || null,
        company_email: data.company_email?.trim() || null,
        firm_id: firmId,
        created_by: user.id,
        last_visited_at: new Date().toISOString()
      };

      const { error } = await supabase.from('contacts').insert(cleanedData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: "Success", description: "Contact added successfully!" });
      form.reset();
      setSelectedStateId('');
      setShowAddDistrict(false);
      setNewDistrictName('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error adding contact:', error);
      let errorMessage = "Failed to add contact. Please try again.";
      if (error?.message === 'Name is required') errorMessage = "Please enter a contact name.";
      else if (error?.message === 'User is not associated with a firm') errorMessage = "You are not associated with a firm.";
      else if (error?.message === 'User is not authenticated') errorMessage = "Please log in again.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    addContactMutation.mutate(data);
  };

  const handleAddDistrict = () => {
    if (!newDistrictName.trim()) {
      toast({ title: "Error", description: "Please enter a district name.", variant: "destructive" });
      return;
    }
    addDistrictMutation.mutate(newDistrictName.trim());
  };

  const contactType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none m-0' : 'sm:max-w-2xl max-h-[90vh]'} p-0 gap-0 overflow-hidden`}>
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <User className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add Contact</h2>
                <p className="text-xs text-slate-500">Create a new contact record</p>
              </div>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <Form {...form}>
              <form id="add-contact-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Contact Type Card */}
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-slate-700">Contact Type</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex gap-2">
                            {['Individual', 'Organization'].map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => field.onChange(type)}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                                  field.value === type
                                    ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Basic Information Card */}
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                      <User className="w-4 h-4 text-sky-500" />
                    </div>
                    <span className="font-medium text-slate-700">Basic Information</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: "Name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">
                          {contactType === 'Organization' ? 'Contact Person Name' : 'Name'} *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} className="rounded-xl h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Organization Details Card */}
                {contactType === 'Organization' && (
                  <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="font-medium text-slate-700">Organization Details</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="organization"
                      rules={{ required: contactType === 'Organization' ? "Organization name is required" : false }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Organization Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter organization name" {...field} className="rounded-xl h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Designation</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter designation" {...field} className="rounded-xl h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Company Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company address" {...field} className="rounded-xl h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">Company Phone</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="Phone" {...field} className="rounded-xl h-11" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="company_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600">Company Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email" {...field} className="rounded-xl h-11" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Contact Details Card */}
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="font-medium text-slate-700">
                      {contactType === 'Organization' ? 'Contact Person Details' : 'Contact Details'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} className="rounded-xl h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+91 XXXXX XXXXX" {...field} className="rounded-xl h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Card */}
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="font-medium text-slate-700">Address</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="address_line_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} className="rounded-xl h-11" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address_line_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">Address Line 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Apartment, suite, etc." {...field} className="rounded-xl h-11" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="pin_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">PIN Code</FormLabel>
                          <FormControl>
                            <Input placeholder="000000" maxLength={6} {...field} className="rounded-xl h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">State</FormLabel>
                          <Select
                            onValueChange={value => {
                              field.onChange(value);
                              setSelectedStateId(value);
                              form.setValue('district_id', '');
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map(state => (
                                <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="district_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">District</FormLabel>
                          {showAddDistrict ? (
                            <div className="flex gap-2">
                              <Input
                                placeholder="District name"
                                value={newDistrictName}
                                onChange={e => setNewDistrictName(e.target.value)}
                                className="rounded-xl h-11"
                              />
                              <Button type="button" size="sm" onClick={handleAddDistrict} disabled={addDistrictMutation.isPending} className="rounded-full">
                                Add
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setShowAddDistrict(false)} className="rounded-full">
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Select
                              onValueChange={value => {
                                if (value === 'add_new') setShowAddDistrict(true);
                                else field.onChange(value);
                              }}
                              value={field.value}
                              disabled={!selectedStateId}
                            >
                              <FormControl>
                                <SelectTrigger className="rounded-xl h-11">
                                  <SelectValue placeholder={!selectedStateId ? "Select state first" : "Select"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {districts.map(district => (
                                  <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                                ))}
                                {selectedStateId && (
                                  <SelectItem value="add_new" className="border-t">
                                    <div className="flex items-center gap-2">
                                      <Plus className="h-4 w-4" />
                                      Add New
                                    </div>
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Referral Information Card */}
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-violet-500" />
                    </div>
                    <span className="font-medium text-slate-700">Referral Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="referred_by_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Referred By (Name)</FormLabel>
                          <FormControl>
                            <Input placeholder="Referrer's name" {...field} className="rounded-xl h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referred_by_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">Referred By (Phone)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="Referrer's phone" {...field} className="rounded-xl h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Notes Card */}
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <span className="font-medium text-slate-700">Notes</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about the contact..."
                            rows={3}
                            {...field}
                            className="rounded-xl"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-full h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-contact-form"
                disabled={addContactMutation.isPending}
                className="flex-1 rounded-full h-11"
              >
                {addContactMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Contact'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
