import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

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

export const AddContactDialog = ({ open, onOpenChange }: AddContactDialogProps) => {
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
      company_email: '',
    },
  });

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
        description: "Failed to add district. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!data.name?.trim()) {
        throw new Error('Name is required');
      }

      if (!firmId) {
        throw new Error('User is not associated with a firm');
      }

      if (!user?.id) {
        throw new Error('User is not authenticated');
      }

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
        last_visited_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('contacts')
        .insert(cleanedData);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Success",
        description: "Contact added successfully!",
      });
      form.reset();
      setSelectedStateId('');
      setShowAddDistrict(false);
      setNewDistrictName('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error adding contact:', error);
      let errorMessage = "Failed to add contact. Please try again.";
      
      if (error?.message === 'Name is required') {
        errorMessage = "Please enter a contact name.";
      } else if (error?.message === 'User is not associated with a firm') {
        errorMessage = "You are not associated with a firm. Please contact your administrator.";
      } else if (error?.message === 'User is not authenticated') {
        errorMessage = "Please log in again and try.";
      } else if (error?.code === '22P02') {
        errorMessage = "Invalid data format. Please check your input and try again.";
      } else if (error?.code === '23505') {
        errorMessage = "A contact with this information already exists.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    addContactMutation.mutate(data);
  };

  const handleAddDistrict = () => {
    if (!newDistrictName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a district name.",
        variant: "destructive",
      });
      return;
    }
    addDistrictMutation.mutate(newDistrictName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your contact management system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Contact Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch('type') === 'Organization' ? 'Contact Person Name' : 'Name'} *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('type') === 'Organization' && (
              <FormField
                control={form.control}
                name="organization"
                rules={{ required: form.watch('type') === 'Organization' ? "Organization name is required" : false }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization/company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('type') === 'Organization' && (
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter designation in company" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter email address" 
                        {...field} 
                      />
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
                      <Input 
                        type="tel" 
                        placeholder="Enter phone number" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Business Information - Only for Organization */}
            {form.watch('type') === 'Organization' && (
              <>
                <FormField
                  control={form.control}
                  name="company_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Phone</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="Enter company phone number" 
                          {...field} 
                        />
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
                        <Input 
                          type="email" 
                          placeholder="Enter company email address" 
                          {...field} 
                        />
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
                        <Input 
                          placeholder="Enter company address" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="visit_purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Visit</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Legal consultation, Document review" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter address line 1" 
                      {...field} 
                    />
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
                    <Input 
                      placeholder="Enter address line 2 (optional)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pin_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter PIN code" 
                        {...field} 
                      />
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedStateId(value);
                        form.setValue('district_id', ''); // Reset district when state changes
                      }} 
                      value={field.value}
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
            </div>

            <FormField
              control={form.control}
              name="district_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
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
                    </div>
                  ) : (
                    <Select 
                      onValueChange={(value) => {
                        if (value === 'add_new') {
                          setShowAddDistrict(true);
                        } else {
                          field.onChange(value);
                        }
                      }} 
                      value={field.value}
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

            <FormField
              control={form.control}
              name="referred_by_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referred By (Name)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter referrer's name" 
                      {...field} 
                    />
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
                  <FormLabel>Referred By (Phone)</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="Enter referrer's phone" 
                      {...field} 
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the contact"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addContactMutation.isPending}
              >
                {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};