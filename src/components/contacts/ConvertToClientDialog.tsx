import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { convertContactSchema, ConvertContactFormData } from '@/lib/convertContactValidation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserPlus, ArrowRight, ArrowLeft, CheckCircle2, Plus } from 'lucide-react';

interface ConvertToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

type ConversionStep = 'preview' | 'form' | 'confirm';

export const ConvertToClientDialog = ({
  open,
  onOpenChange,
  contact
}: ConvertToClientDialogProps) => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<ConversionStep>('preview');
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
      setCurrentStep('preview');
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
      
      if (contact.visit_purpose) {
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
      setCurrentStep('preview');
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

  const stateName = states.find(s => s.id === contact.state_id)?.name;
  const districtName = districts.find(d => d.id === contact.district_id)?.name;
  const addressParts = [contact.address_line_1, contact.address_line_2].filter(Boolean);
  const displayAddress = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convert Contact to Client
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'preview' && 'Review contact information before proceeding'}
            {currentStep === 'form' && 'Complete client information'}
            {currentStep === 'confirm' && 'Confirm conversion'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'preview' ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              1
            </div>
            <span className="text-sm font-medium hidden sm:inline">Preview</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 ${currentStep === 'form' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'form' ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Complete Info</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 ${currentStep === 'confirm' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'confirm' ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              3
            </div>
            <span className="text-sm font-medium hidden sm:inline">Confirm</span>
          </div>
        </div>

        <Separator />

        {/* Preview Step */}
        {currentStep === 'preview' && (
          <div className="space-y-6 py-4">
            <div className="bg-accent/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium mt-1">{contact.name}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {contact.type || (contact.organization ? 'Organization' : 'Individual')}
                  </Badge>
                </div>

                {contact.organization && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Organization</Label>
                    <p className="font-medium mt-1">{contact.organization}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium mt-1">{contact.email || 'Not provided'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium mt-1">{contact.phone || 'Not provided'}</p>
                </div>

                <div className="col-span-2">
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium mt-1">{displayAddress}</p>
                  {stateName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {districtName && `${districtName}, `}{stateName}
                      {contact.pin_code && ` - ${contact.pin_code}`}
                    </p>
                  )}
                </div>

                {contact.visit_purpose && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Purpose of Visit</Label>
                    <p className="font-medium mt-1">{contact.visit_purpose}</p>
                  </div>
                )}

                {(contact.referred_by_name || contact.referred_by_phone) && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Referred By</Label>
                    <p className="font-medium mt-1">
                      {contact.referred_by_name}
                      {contact.referred_by_phone && ` (${contact.referred_by_phone})`}
                    </p>
                  </div>
                )}

                {contact.notes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => setCurrentStep('form')}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Form Step */}
        {currentStep === 'form' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => setCurrentStep('confirm'))} className="space-y-6 py-4">
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

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Basic Information</h3>
                
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

                {form.watch('type') === 'Organization' && (
                  <>
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

                    <div className="grid grid-cols-2 gap-4">
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
                  </>
                )}
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">
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

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Address Information</h3>
                
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

              {/* Referral Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Referral Information</h3>
                
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

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Additional Information</h3>
                
                <FormField
                  control={form.control}
                  name="case_ref"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Reference / Matter</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter case reference or matter type" />
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
                          rows={4}
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
                          rows={4}
                          placeholder="Add general notes about the client..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('preview')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit">
                  Review & Confirm
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Confirm Step */}
        {currentStep === 'confirm' && (
          <div className="space-y-6 py-4">
            <div className="bg-accent/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold">Ready to Convert</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Please review the information below before converting this contact to a client.
                This action cannot be undone.
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{form.getValues('full_name')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">{form.getValues('type')}</Badge>
                </div>
                {form.getValues('organization') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{form.getValues('organization')}</span>
                  </div>
                )}
                {form.getValues('email') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{form.getValues('email')}</span>
                  </div>
                )}
                {form.getValues('phone') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{form.getValues('phone')}</span>
                  </div>
                )}
                {form.getValues('case_ref') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Case Reference:</span>
                    <span className="font-medium">{form.getValues('case_ref')}</span>
                  </div>
                )}
              </div>

              {form.getValues('office_notes') && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-muted-foreground">Office Notes</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {form.getValues('office_notes')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('form')}
                disabled={convertMutation.isPending}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={convertMutation.isPending}
              >
                {convertMutation.isPending ? (
                  <>Converting...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Convert to Client
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
