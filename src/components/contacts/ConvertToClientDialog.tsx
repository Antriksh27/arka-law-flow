import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { convertContactSchema, ConvertContactFormData } from '@/lib/convertContactValidation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Plus, X, User, Building2, Phone, MapPin, UserCheck, FileText, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConvertToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

export const ConvertToClientDialog = ({ open, onOpenChange, contact }: ConvertToClientDialogProps) => {
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

  const form = useForm<ConvertContactFormData>({
    resolver: zodResolver(convertContactSchema),
    defaultValues: {
      full_name: '',
      type: 'Individual',
      email: '',
      phone: '',
      organization: '',
      designation: '',
      company_address: '',
      company_phone: '',
      company_email: '',
      address_line_1: '',
      address_line_2: '',
      state_id: '',
      district_id: '',
      pin_code: '',
      referred_by_name: '',
      referred_by_phone: '',
      notes: '',
      office_notes: '',
      case_ref: ''
    }
  });

  useEffect(() => {
    if (contact && open) {
      const contactType = contact.type || (contact.organization ? 'Organization' : 'Individual');
      form.reset({
        full_name: contact.name || '',
        type: contactType,
        email: contact.email || '',
        phone: contact.phone || '',
        organization: contact.organization || '',
        designation: contact.designation || '',
        company_address: contact.company_address || '',
        company_phone: contact.company_phone || '',
        company_email: contact.company_email || '',
        address_line_1: contact.address_line_1 || '',
        address_line_2: contact.address_line_2 || '',
        state_id: contact.state_id || '',
        district_id: contact.district_id || '',
        pin_code: contact.pin_code || '',
        referred_by_name: contact.referred_by_name || '',
        referred_by_phone: contact.referred_by_phone || '',
        notes: contact.notes || '',
        office_notes: '',
        case_ref: contact.visit_purpose || ''
      });
      setSelectedStateId(contact.state_id || '');
    }
  }, [contact, open, form]);

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
      toast({ title: "Error", description: "Failed to add district", variant: "destructive" });
    }
  });

  const convertMutation = useMutation({
    mutationFn: async (formData: ConvertContactFormData) => {
      if (!firmId || !user?.id) throw new Error('Missing required authentication data');
      if (!contact?.id || contact.id === 'temp-id' || contact.id.startsWith('temp-')) {
        throw new Error('Cannot convert temporary contact');
      }

      if (formData.email || formData.phone) {
        const { data: existingClients } = await supabase.from('clients').select('id, full_name, email, phone').eq('firm_id', firmId).or(`email.eq.${formData.email || 'null'},phone.eq.${formData.phone || 'null'}`);
        if (existingClients && existingClients.length > 0) {
          const duplicate = existingClients[0];
          const matchField = duplicate.email === formData.email ? 'email' : 'phone';
          throw new Error(`A client with this ${matchField} already exists: ${duplicate.full_name}`);
        }
      }

      const addressParts = [formData.address_line_1, formData.address_line_2].filter(Boolean);
      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

      const noteParts = [];
      if (formData.notes?.trim()) noteParts.push(formData.notes.trim());
      if (contact.visit_purpose && contact.visit_purpose !== formData.case_ref) {
        noteParts.push(`\n--- Original Visit Purpose ---\n${contact.visit_purpose}`);
      }
      noteParts.push(`\n--- Conversion Details ---`);
      noteParts.push(`Converted from contact on: ${new Date().toLocaleString('en-IN')}`);
      noteParts.push(`Converted by: ${user.email}`);
      const finalNotes = noteParts.join('\n\n');

      const { data: newClient, error: clientError } = await supabase.from('clients').insert({
        full_name: formData.full_name.trim(),
        type: formData.type,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        organization: formData.organization?.trim() || null,
        designation: formData.designation?.trim() || null,
        company_address: formData.company_address?.trim() || null,
        company_phone: formData.company_phone?.trim() || null,
        company_email: formData.company_email?.trim() || null,
        address: fullAddress,
        pin_code: formData.pin_code?.trim() || null,
        state: states.find(s => s.id === formData.state_id)?.name || null,
        district: districts.find(d => d.id === formData.district_id)?.name || null,
        referred_by_name: formData.referred_by_name?.trim() || null,
        referred_by_phone: formData.referred_by_phone?.trim() || null,
        case_ref: formData.case_ref?.trim() || null,
        notes: finalNotes,
        status: 'lead',
        firm_id: firmId,
        created_by: user.id
      }).select().single();

      if (clientError) throw clientError;

      if (formData.office_notes?.trim()) {
        await supabase.from('client_internal_notes').insert({
          client_id: newClient.id,
          note: formData.office_notes.trim(),
          created_by: user.id
        });
      }

      await supabase.from('contacts').delete().eq('id', contact.id);

      return { client: newClient };
    },
    onSuccess: data => {
      toast({ title: "Success", description: `${data.client.full_name} has been converted to a client successfully!` });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['reception-contacts'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Conversion Failed", description: error.message || "Failed to convert contact to client", variant: "destructive" });
    }
  });

  const handleAddDistrict = () => {
    if (!newDistrictName.trim()) {
      toast({ title: "Error", description: "Please enter a district name", variant: "destructive" });
      return;
    }
    addDistrictMutation.mutate(newDistrictName.trim());
  };

  const onSubmit = (data: ConvertContactFormData) => {
    convertMutation.mutate(data);
  };

  if (!contact) return null;

  const clientType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Convert to Client</h2>
                <p className="text-xs text-slate-500">Review and complete the information</p>
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
              <form id="convert-contact-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Client Type Card */}
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-slate-700">Client Type</span>
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
                                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
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
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                      <User className="w-4 h-4 text-violet-500" />
                    </div>
                    <span className="font-medium text-slate-700">Basic Information</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">
                          {clientType === 'Organization' ? 'Contact Person Name' : 'Full Name'} *
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
                {clientType === 'Organization' && (
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
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-sky-500" />
                    </div>
                    <span className="font-medium text-slate-700">
                      {clientType === 'Organization' ? 'Contact Person Details' : 'Contact Details'}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600">State</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={value => {
                              field.onChange(value);
                              setSelectedStateId(value);
                              form.setValue('district_id', '');
                            }}
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
                  </div>

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
                            value={field.value}
                            onValueChange={value => {
                              if (value === 'add_new') setShowAddDistrict(true);
                              else field.onChange(value);
                            }}
                            disabled={!selectedStateId}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder={!selectedStateId ? "Select state first" : "Select district"} />
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
                          <FormLabel className="text-sm text-slate-600">Referred By Name</FormLabel>
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
                          <FormLabel className="text-sm text-slate-600">Referred By Phone</FormLabel>
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
                    name="office_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">
                          Office Notes
                          <span className="text-xs text-slate-400 ml-2">(Visible to staff only)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Internal notes..." rows={2} {...field} className="rounded-xl" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">General Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes..." rows={2} {...field} className="rounded-xl" />
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
                disabled={convertMutation.isPending}
                className="flex-1 rounded-full h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="convert-contact-form"
                disabled={convertMutation.isPending}
                className="flex-1 rounded-full h-11 bg-emerald-600 hover:bg-emerald-700"
              >
                {convertMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  'Convert to Client'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
