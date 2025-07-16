import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

interface ConvertContactToClientDialogProps {
  contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    address_line_1?: string;
    address_line_2?: string;
    visit_purpose?: string;
    pin_code?: string;
    state_id?: string;
    district_id?: string;
    last_visited_at?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ConvertContactFormData {
  full_name: string;
  email?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  pin_code?: string;
  state_id?: string;
  district_id?: string;
  visit_purpose?: string;
  organization?: string;
  assigned_lawyer_ids?: string[];
  case_title?: string;
  case_description?: string;
  case_type?: 'civil' | 'criminal' | 'family' | 'corporate' | 'tax' | 'other' | 'labor' | 'intellectual_property' | 'real_estate' | 'immigration' | 'constitutional';
  estimated_fees?: number;
  payment_terms?: string;
  notes?: string;
}

export const ConvertContactToClientDialog: React.FC<ConvertContactToClientDialogProps> = ({
  contact,
  open,
  onOpenChange,
}) => {
  console.log('ConvertContactToClientDialog: Received contact data:', contact);
  const { toast } = useToast();
  const { user, firmId } = useAuth();
  const queryClient = useQueryClient();
  
  const [lawyers, setLawyers] = React.useState<Array<{id: string, full_name: string, role: string}>>([]);
  const [selectedLawyers, setSelectedLawyers] = React.useState<string[]>([]);
  const [selectedStateId, setSelectedStateId] = React.useState<string>(contact.state_id || '');
  const [showAddDistrict, setShowAddDistrict] = React.useState(false);
  const [newDistrictName, setNewDistrictName] = React.useState('');
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ConvertContactFormData>({
    defaultValues: {
      full_name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      address_line_1: contact.address_line_1 || '',
      address_line_2: contact.address_line_2 || '',
      pin_code: contact.pin_code || '',
      state_id: contact.state_id || '',
      district_id: contact.district_id || '',
      visit_purpose: contact.visit_purpose || '',
      case_type: 'civil',
      notes: contact.notes || ''
    }
  });

  // Reset form when contact changes
  React.useEffect(() => {
    if (open && contact) {
      console.log('ConvertContactToClientDialog: Contact changed, resetting form values');
      console.log('ConvertContactToClientDialog: Full contact data:', contact);
      
      const formData = {
        full_name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address_line_1: contact.address_line_1 || '',
        address_line_2: contact.address_line_2 || '',
        pin_code: contact.pin_code || '',
        state_id: contact.state_id || '',
        district_id: contact.district_id || '',
        visit_purpose: contact.visit_purpose || '',
        case_type: 'civil' as const,
        notes: contact.notes || ''
      };
      
      console.log('ConvertContactToClientDialog: Form data being set:', formData);
      
      reset(formData);
      setSelectedStateId(contact.state_id || '');
    }
  }, [contact, open, reset]);

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
      setValue('district_id', newDistrict.id);
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

  React.useEffect(() => {
    const fetchLawyers = async () => {
      if (!firmId) {
        console.log('ConvertContactToClientDialog: No firm ID available');
        return;
      }
      
      console.log('ConvertContactToClientDialog: Fetching lawyers for firm:', firmId);
      
      // First, let's check what team members exist
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('firm_id', firmId);
      
      console.log('ConvertContactToClientDialog: Team members:', { teamMembers, teamError });
      
      // Query team members and then get their profile info separately
      const { data: teamMembersData, error: tmError } = await supabase
        .from('team_members')
        .select('user_id, role, full_name')
        .eq('firm_id', firmId)
        .in('role', ['lawyer', 'junior']);
      
      // Sort to always show "chitrajeet upadhyaya" first
      const sortedTeamMembers = teamMembersData?.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      }) || [];
      
      console.log('ConvertContactToClientDialog: Team members query result:', { sortedTeamMembers, tmError });
      
      if (sortedTeamMembers && sortedTeamMembers.length > 0) {
        const lawyers = sortedTeamMembers.map(tm => ({
          id: tm.user_id,
          full_name: tm.full_name,
          role: tm.role
        }));
        console.log('ConvertContactToClientDialog: Processed lawyers:', lawyers);
        setLawyers(lawyers);
      } else {
        console.log('ConvertContactToClientDialog: No team members found');
        setLawyers([]);
      }
    };
    
    fetchLawyers();
  }, [firmId]);

  const convertMutation = useMutation({
    mutationFn: async (formData: ConvertContactFormData) => {
      // Validate required data
      if (!firmId || !user?.id) {
        throw new Error('Missing required authentication data');
      }

      // Check if client with this email already exists
      if (formData.email) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('email', formData.email)
          .eq('firm_id', firmId)
          .single();
        
        if (existingClient) {
          throw new Error('A client with this email already exists');
        }
      }

      // Create the new client
      const clientAddress = [formData.address_line_1, formData.address_line_2].filter(Boolean).join(', ');
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: clientAddress,
          organization: formData.organization,
          assigned_lawyer_id: formData.assigned_lawyer_ids?.[0],
          firm_id: firmId,
          status: 'active',
          notes: formData.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create a case if case details are provided
      let newCase = null;
      if (formData.case_title) {
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .insert({
            title: formData.case_title,
            case_title: formData.case_title,
            description: formData.case_description,
            case_type: formData.case_type,
            client_id: newClient.id,
            assigned_to: formData.assigned_lawyer_ids?.[0],
            firm_id: firmId,
            created_by: user?.id,
            status: 'open',
            priority: 'medium'
          })
          .select()
          .single();

        if (caseError) throw caseError;
        newCase = caseData;
      }

      // Remove the contact from contacts table (transfer complete)
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (deleteError) throw deleteError;

      return { client: newClient, case: newCase };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.client.full_name} has been converted to a client${data.case ? ' and a case has been created' : ''}`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reception-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error converting contact to client:', error);
      
      // Extract specific error message from different error formats
      let errorMessage = "Failed to convert contact to client. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Conversion Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ConvertContactFormData) => {
    convertMutation.mutate(data);
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
    <div className="min-h-screen max-h-screen overflow-y-auto bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Convert Contact to Client</h1>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...register('full_name', { required: 'Full name is required' })}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                )}
              </div>

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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  {...register('organization')}
                  placeholder="Add organization/company name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="visit_purpose">Purpose of Visit</Label>
              <Input
                id="visit_purpose"
                {...register('visit_purpose')}
                placeholder="e.g., Legal consultation, Document review"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_line_1">Address Line 1</Label>
                <Input
                  id="address_line_1"
                  {...register('address_line_1')}
                  placeholder="Enter address line 1"
                />
              </div>

              <div>
                <Label htmlFor="address_line_2">Address Line 2</Label>
                <Input
                  id="address_line_2"
                  {...register('address_line_2')}
                  placeholder="Enter address line 2 (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pin_code">PIN Code</Label>
                <Input
                  id="pin_code"
                  {...register('pin_code')}
                  placeholder="Enter PIN code"
                />
              </div>

              <div>
                <Label htmlFor="state_id">State</Label>
                <Select 
                  onValueChange={(value) => {
                    setValue('state_id', value);
                    setSelectedStateId(value);
                    setValue('district_id', ''); // Reset district when state changes
                  }} 
                  value={watch('state_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
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
            </div>

            <div>
              <Label htmlFor="district_id">District</Label>
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
                      setValue('district_id', value);
                    }
                  }} 
                  value={watch('district_id')}
                  disabled={!selectedStateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedStateId ? "Select state first" : "Select district"} />
                  </SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes about the client"
                rows={3}
              />
            </div>

            <div>
              <Label>Assigned Lawyers</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {lawyers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lawyers found in your firm</p>
                ) : (
                  lawyers.map((lawyer) => (
                    <div key={lawyer.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lawyer-${lawyer.id}`}
                        checked={selectedLawyers.includes(lawyer.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = checked
                            ? [...selectedLawyers, lawyer.id]
                            : selectedLawyers.filter(id => id !== lawyer.id);
                          setSelectedLawyers(newSelected);
                          setValue('assigned_lawyer_ids', newSelected);
                        }}
                      />
                      <Label 
                        htmlFor={`lawyer-${lawyer.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {lawyer.full_name} ({lawyer.role})
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {selectedLawyers.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedLawyers.length} lawyer(s) selected
                </p>
              )}
            </div>
          </div>

          {/* Case Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Case Information (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="case_title">Case Title</Label>
                <Input
                  id="case_title"
                  {...register('case_title')}
                  placeholder="e.g., Property Dispute Resolution"
                />
              </div>

              <div>
                <Label htmlFor="case_type">Case Type</Label>
                <Select onValueChange={(value) => setValue('case_type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="case_description">Case Description</Label>
              <Textarea
                id="case_description"
                {...register('case_description')}
                placeholder="Brief description of the case..."
                rows={3}
              />
            </div>
          </div>

          {/* Fees Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fees & Payment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated_fees">Estimated Fees (₹)</Label>
                <Input
                  id="estimated_fees"
                  type="number"
                  {...register('estimated_fees', { valueAsNumber: true })}
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  {...register('payment_terms')}
                  placeholder="e.g., 50% advance, 50% on completion"
                />
              </div>
            </div>
          </div>

            <div className="flex gap-4 pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Converting...' : 'Convert to Client'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};