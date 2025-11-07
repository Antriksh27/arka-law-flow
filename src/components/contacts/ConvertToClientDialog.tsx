import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { convertContactSchema, ConvertContactFormData } from '@/lib/convertContactValidation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Plus } from 'lucide-react';

interface ConvertToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

export const ConvertToClientDialog = ({
  open,
  onOpenChange,
  contact
}: ConvertToClientDialogProps) => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');

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
    }
  });

  // Fetch districts
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
      city: '',
      state_id: '',
      district_id: '',
      pin_code: '',
      referred_by_name: '',
      referred_by_phone: '',
      notes: '',
      office_notes: '',
      case_ref: '',
    }
  });

  // Initialize form with contact data
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
        city: contact.city || '',
        state_id: contact.state_id || '',
        district_id: contact.district_id || '',
        pin_code: contact.pin_code || '',
        referred_by_name: contact.referred_by_name || '',
        referred_by_phone: contact.referred_by_phone || '',
        notes: contact.notes || '',
        office_notes: '',
        case_ref: contact.visit_purpose || '',
      });
      
      setSelectedStateId(contact.state_id || '');
    }
  }, [contact, open, form]);

  // Add district mutation
  const addDistrictMutation = useMutation({
    mutationFn: async (districtName: string) => {
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
    },
    onSuccess: (newDistrict) => {
      queryClient.invalidateQueries({ queryKey: ['districts', selectedStateId] });
      form.setValue('district_id', newDistrict.id);
      setShowAddDistrict(false);
      setNewDistrictName('');
      toast({
        title: "Success",
        description: "District added successfully!",
      });
    },
    onError: (error) => {
      console.error('Error adding district:', error);
      toast({
        title: "Error",
        description: "Failed to add district",
        variant: "destructive",
      });
    },
  });

  // Convert mutation
  const convertMutation = useMutation({
    mutationFn: async (formData: ConvertContactFormData) => {
      if (!firmId || !user?.id) {
        throw new Error('Missing required authentication data');
      }

      if (!contact?.id || contact.id === 'temp-id' || contact.id.startsWith('temp-')) {
        throw new Error('Cannot convert temporary contact');
      }

      // Check for duplicate clients
      if (formData.email || formData.phone) {
        const { data: existingClients } = await supabase
          .from('clients')
          .select('id, full_name, email, phone')
          .eq('firm_id', firmId)
          .or(`email.eq.${formData.email || 'null'},phone.eq.${formData.phone || 'null'}`);

        if (existingClients && existingClients.length > 0) {
          const duplicate = existingClients[0];
          const matchField = duplicate.email === formData.email ? 'email' : 'phone';
          throw new Error(`A client with this ${matchField} already exists: ${duplicate.full_name}`);
        }
      }

      // Build address
      const addressParts = [formData.address_line_1, formData.address_line_2, formData.city]
        .filter(Boolean);
      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

      // Build comprehensive notes
      const noteParts = [];
      
      if (formData.office_notes?.trim()) {
        noteParts.push(`[OFFICE STAFF ONLY]\n${formData.office_notes.trim()}`);
      }
      
      if (formData.notes?.trim()) {
        noteParts.push(formData.notes.trim());
      }
      
      if (contact.visit_purpose && contact.visit_purpose !== formData.case_ref) {
        noteParts.push(`\n--- Original Visit Purpose ---\n${contact.visit_purpose}`);
      }
      
      noteParts.push(`\n--- Conversion Details ---`);
      noteParts.push(`Converted from contact on: ${new Date().toLocaleString('en-IN')}`);
      noteParts.push(`Converted by: ${user.email}`);
      
      const finalNotes = noteParts.join('\n\n');

      // Create client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
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
          city: formData.city?.trim() || null,
          pin_code: formData.pin_code?.trim() || null,
          state: states.find(s => s.id === formData.state_id)?.name || null,
          district: districts.find(d => d.id === formData.district_id)?.name || null,
          referred_by_name: formData.referred_by_name?.trim() || null,
          referred_by_phone: formData.referred_by_phone?.trim() || null,
          case_ref: formData.case_ref?.trim() || null,
          notes: finalNotes,
          status: 'lead',
          firm_id: firmId,
          created_by: user.id,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Delete contact
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (deleteError) {
        console.error('Error deleting contact:', deleteError);
      }

      return { client: newClient };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.client.full_name} has been converted to a client successfully!`,
      });

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['reception-contacts'] });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error converting contact:', error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert contact to client",
        variant: "destructive",
      });
    }
  });

  const handleAddDistrict = () => {
    if (!newDistrictName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a district name",
        variant: "destructive",
      });
      return;
    }
    addDistrictMutation.mutate(newDistrictName.trim());
  };

  const onSubmit = (data: ConvertContactFormData) => {
    convertMutation.mutate(data);
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convert Contact to Client
          </DialogTitle>
          <DialogDescription>
            Review and complete the information below to convert this contact to a client
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Contact Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Type *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Individual" id="type-individual" />
                        <Label htmlFor="type-individual" className="font-normal cursor-pointer">
                          Individual
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Organization" id="type-organization" />
                        <Label htmlFor="type-organization" className="font-normal cursor-pointer">
                          Organization
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('type') === 'Organization' ? 'Contact Person Name' : 'Full Name'} *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Organization Details - Only for Organization */}
            {form.watch('type') === 'Organization' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3">Organization Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter organization name" />
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
                        <FormLabel>Designation</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter designation" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter company phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Enter company email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3">
                {form.watch('type') === 'Organization' ? 'Contact Person Details' : 'Contact Details'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3">Address Information</h3>
              
              <FormField
                control={form.control}
                name="address_line_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter address line 1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_line_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter address line 2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedStateId(value);
                          form.setValue('district_id', '');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.id} value={state.id}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pin_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="6 digits" maxLength={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="district_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    {showAddDistrict ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter district name"
                          value={newDistrictName}
                          onChange={(e) => setNewDistrictName(e.target.value)}
                        />
                        <Button
                          type="button"
                          onClick={handleAddDistrict}
                          disabled={addDistrictMutation.isPending}
                          size="sm"
                        >
                          {addDistrictMutation.isPending ? 'Adding...' : 'Add'}
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
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value === 'add_new') {
                            setShowAddDistrict(true);
                          } else {
                            field.onChange(value);
                          }
                        }}
                        disabled={!selectedStateId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedStateId ? "Select state first" : "Select district"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {districts.map((district) => (
                            <SelectItem key={district.id} value={district.id}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Referral Information */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3">Referral Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="referred_by_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred By Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter referrer name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referred_by_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred By Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter referrer phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b-2 border-border pb-3">Additional Information</h3>
              
              <FormField
                control={form.control}
                name="case_ref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Visit / Case Reference</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter purpose of visit or case reference" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="office_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Office Notes
                      <span className="text-xs text-muted-foreground ml-2">(Visible to staff only)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Add internal notes visible to office staff only..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Add general notes about the client..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={convertMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={convertMutation.isPending}>
                {convertMutation.isPending ? 'Converting...' : 'Convert to Client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
