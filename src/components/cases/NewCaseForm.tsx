
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FetchCaseDialog } from './FetchCaseDialog';

interface NewCaseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  preSelectedClientId?: string;
}

interface CaseFormData {
  case_title: string;
  description?: string;
  client_id?: string;
  assigned_users?: string[];
  case_type: string;
  status: string;
  priority: string;
  case_number?: string;
  filing_date?: string;
  court_name?: string;
  cnr_number?: string;
  filing_number?: string;
  petitioner?: string;
  respondent?: string;
  advocate_name?: string;
  district?: string;
}

export const NewCaseForm: React.FC<NewCaseFormProps> = ({
  onSuccess,
  onCancel,
  preSelectedClientId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFetchDialog, setShowFetchDialog] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CaseFormData>({
    defaultValues: {
      case_type: 'civil',
      status: 'open',
      priority: 'medium',
      client_id: preSelectedClientId || ''
    }
  });

  // Fetch clients for assignment
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch lawyers from the firm for assignment
  const { data: lawyers = [] } = useQuery({
    queryKey: ['firm-lawyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          role,
          law_firm_members!inner(
            role,
            law_firm_id
          )
        `)
        .in('law_firm_members.role', ['admin', 'lawyer', 'partner', 'associate', 'junior'])
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      const caseData = {
        title: data.case_title, // Keep the existing title field for backward compatibility
        case_title: data.case_title, // Add the new case_title field
        description: data.description || null,
        client_id: data.client_id || null,
        case_type: data.case_type as any,
        status: data.status as any,
        priority: data.priority as any,
        case_number: data.case_number || null,
        filing_date: data.filing_date ? new Date(data.filing_date).toISOString().split('T')[0] : null,
        court_name: data.court_name || null,
        cnr_number: data.cnr_number || null,
        filing_number: data.filing_number || null,
        petitioner: data.petitioner || null,
        respondent: data.respondent || null,
        advocate_name: data.advocate_name || null,
        district: data.district || null,
        assigned_users: data.assigned_users || [],
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from('cases')
        .insert(caseData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['client-cases'] });
      toast({
        title: "Success",
        description: "Case created successfully"
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create case",
        variant: "destructive"
      });
      console.error('Error creating case:', error);
    }
  });

  const onSubmit = (data: CaseFormData) => {
    if (!data.case_title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a case title",
        variant: "destructive"
      });
      return;
    }
    createCaseMutation.mutate(data);
  };

  const handleFetchSuccess = (fetchedData: any) => {
    // Populate form with fetched data
    if (fetchedData.title) setValue('case_title', fetchedData.title);
    if (fetchedData.case_number) setValue('case_number', fetchedData.case_number);
    if (fetchedData.court) setValue('court_name', fetchedData.court);
    if (fetchedData.cnr_number) setValue('cnr_number', fetchedData.cnr_number);
    if (fetchedData.filing_number) setValue('filing_number', fetchedData.filing_number);
    if (fetchedData.petitioner) setValue('petitioner', fetchedData.petitioner);
    if (fetchedData.respondent) setValue('respondent', fetchedData.respondent);
    if (fetchedData.advocate_name) setValue('advocate_name', fetchedData.advocate_name);
    if (fetchedData.district) setValue('district', fetchedData.district);
    if (fetchedData.filing_date) setValue('filing_date', fetchedData.filing_date);
    
    setShowFetchDialog(false);
    toast({
      title: "Success",
      description: "Case details fetched successfully"
    });
  };

  return (
    <div className="max-w-full h-screen p-8 bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Add New Case</h1>
            <p className="text-gray-600 mt-2">Enter the case information below.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFetchDialog(true)}
            className="text-white border-primary bg-slate-800 hover:bg-slate-700"
          >
            Fetch Case Details
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="case_title">Case Title *</Label>
              <Input
                id="case_title"
                {...register('case_title', { required: 'Case title is required' })}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter case title..."
              />
              {errors.case_title && (
                <p className="text-sm text-red-600 mt-1">{errors.case_title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="client_id">Client</Label>
              <select
                id="client_id"
                {...register('client_id')}
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                disabled={!!preSelectedClientId}
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="case_type">Case Type</Label>
              <select
                id="case_type"
                {...register('case_type')}
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="civil">Civil</option>
                <option value="criminal">Criminal</option>
                <option value="corporate">Corporate</option>
                <option value="family">Family</option>
                <option value="tax">Tax</option>
                <option value="labor">Labor</option>
                <option value="intellectual_property">Intellectual Property</option>
                <option value="real_estate">Real Estate</option>
                <option value="immigration">Immigration</option>
                <option value="constitutional">Constitutional</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="open">Open</option>
                <option value="in_court">In Court</option>
                <option value="on_hold">On Hold</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register('priority')}
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <Label htmlFor="case_number">Case Number</Label>
              <Input
                id="case_number"
                {...register('case_number')}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter case number..."
              />
            </div>

            <div>
              <Label htmlFor="filing_date">Filing Date</Label>
              <Input
                id="filing_date"
                type="date"
                {...register('filing_date')}
                className="mt-2 bg-white border-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="court_name">Court</Label>
              <Input
                id="court_name"
                {...register('court_name')}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter court name..."
              />
            </div>

            <div>
              <Label htmlFor="cnr_number">CNR Number</Label>
              <Input
                id="cnr_number"
                {...register('cnr_number')}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter CNR number..."
              />
            </div>

            <div>
              <Label htmlFor="filing_number">Filing Number</Label>
              <Input
                id="filing_number"
                {...register('filing_number')}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter filing number..."
              />
            </div>

            <div>
              <Label htmlFor="petitioner">Petitioner</Label>
              <Input
                id="petitioner"
                {...register('petitioner')}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter petitioner name..."
              />
            </div>

            <div>
              <Label htmlFor="respondent">Respondent</Label>
              <Input
                id="respondent"
                {...register('respondent')}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter respondent name..."
              />
            </div>

            <div>
              <Label htmlFor="advocate_name">Advocate Name</Label>
              <Input
                id="advocate_name"
                {...register('advocate_name')}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter advocate name..."
              />
            </div>

            <div>
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                {...register('district')}
                className="mt-2 bg-white border-gray-300"
                placeholder="Enter district..."
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="assigned_users">Assign Lawyers</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-white">
                {lawyers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No lawyers available</p>
                ) : (
                  lawyers.map((lawyer) => (
                    <label key={lawyer.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        value={lawyer.id}
                        {...register('assigned_users')}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm">{lawyer.full_name}</span>
                      <span className="text-xs text-gray-500 capitalize">({lawyer.role})</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Case Description</Label>
              <textarea
                id="description"
                {...register('description')}
                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                rows={4}
                placeholder="Enter case description..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="bg-red-700 hover:bg-red-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-800 hover:bg-slate-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>

        <FetchCaseDialog
          open={showFetchDialog}
          onClose={() => setShowFetchDialog(false)}
          onSuccess={handleFetchSuccess}
        />
      </div>
    </div>
  );
};
