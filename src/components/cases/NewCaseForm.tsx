import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FetchCaseDialog } from './FetchCaseDialog';
interface NewCaseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  preSelectedClientId?: string;
  hideHeader?: boolean;
}
interface CaseFormData {
  case_title: string;
  description?: string;
  client_id?: string;
  assigned_users?: string[];
  case_type: string;
  status: string;
  by_against?: string;
  reference_number?: string;
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
  preSelectedClientId,
  hideHeader = false
}) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [showFetchDialog, setShowFetchDialog] = useState(false);
  const {
    firmId
  } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CaseFormData>({
    defaultValues: {
      case_type: 'civil',
      status: 'open',
      client_id: preSelectedClientId || ''
    }
  });

  // Fetch clients for assignment
  const {
    data: clients = []
  } = useQuery({
    queryKey: ['clients-for-cases'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('clients').select('id, full_name').order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch lawyers from the firm for assignment
  const {
    data: lawyers = []
  } = useQuery({
    queryKey: ['firm-lawyers', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const {
        data,
        error
      } = await supabase.from('team_members').select('user_id, full_name, role').eq('firm_id', firmId).in('role', ['admin', 'lawyer', 'junior']);
      if (error) throw error;

      // Map to expected shape (id used in UI)
      const mapped = (data || []).map(tm => ({
        id: tm.user_id,
        full_name: tm.full_name,
        role: tm.role
      }));

      // Sort to always show "chitrajeet upadhyaya" first
      return mapped.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!firmId
  });
  const createCaseMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Get first assigned user for assigned_to field (single value)
      const firstAssignedUser = Array.isArray(data.assigned_users) && data.assigned_users.length > 0 ? data.assigned_users[0] : null;
      const caseData = {
        title: data.case_title,
        case_title: data.case_title,
        description: data.description || null,
        client_id: data.client_id || null,
        case_type: data.case_type as any,
        status: data.status as any,
        by_against: data.by_against ? data.by_against as any : null,
        reference_number: data.reference_number || null,
        case_number: data.case_number || null,
        filing_date: data.filing_date ? new Date(data.filing_date).toISOString().split('T')[0] : null,
        court_name: data.court_name || null,
        cnr_number: data.cnr_number || null,
        filing_number: data.filing_number || null,
        petitioner: data.petitioner || null,
        respondent: data.respondent || null,
        advocate_name: data.advocate_name || null,
        district: data.district || null,
        assigned_to: firstAssignedUser,
        created_by: userId,
        firm_id: firmId
      };
      const {
        error
      } = await supabase.from('cases').insert(caseData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cases']
      });
      queryClient.invalidateQueries({
        queryKey: ['client-cases']
      });
      toast({
        title: "Success",
        description: "Case created successfully"
      });
      onSuccess();
    },
    onError: error => {
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
  return <div className="h-full p-4 sm:p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-4">
        {!hideHeader && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Add New Case</h1>
              <p className="text-slate-500 text-sm mt-1">Enter the case information below.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setShowFetchDialog(true)} className="text-white border-primary bg-slate-800 hover:bg-slate-700 w-full sm:w-auto">
              Fetch Case Details
            </Button>
          </div>
        )}

        {hideHeader && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setShowFetchDialog(true)} className="text-white border-primary bg-slate-800 hover:bg-slate-700 text-sm">
              Fetch Case Details
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="case_title" className="text-sm">Case Title *</Label>
                <Input id="case_title" {...register('case_title', {
                required: 'Case title is required'
              })} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="Enter case title..." />
                {errors.case_title && <p className="text-sm text-red-600 mt-1">{errors.case_title.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id" className="text-sm">Client</Label>
                  <select id="client_id" {...register('client_id')} className="w-full px-3 py-2 mt-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm" disabled={!!preSelectedClientId}>
                    <option value="">Select a client...</option>
                    {clients.map(client => <option key={client.id} value={client.id}>
                        {client.full_name}
                      </option>)}
                  </select>
                </div>

                <div>
                  <Label htmlFor="case_type" className="text-sm">Case Type</Label>
                  <select id="case_type" {...register('case_type')} className="w-full px-3 py-2 mt-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm">
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
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <select id="status" {...register('status')} className="w-full px-3 py-2 mt-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm">
                    <option value="open">Open</option>
                    <option value="in_court">In Court</option>
                    <option value="on_hold">On Hold</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="by_against" className="text-sm">By/Against</Label>
                  <select id="by_against" {...register('by_against')} className="w-full px-3 py-2 mt-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm">
                    <option value="">Not specified</option>
                    <option value="by">By (Filed by client)</option>
                    <option value="against">Against (Filed against client)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Case Details Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Case Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference_number" className="text-sm">Reference Number</Label>
                <Input id="reference_number" {...register('reference_number')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="Internal reference..." />
              </div>

              <div>
                <Label htmlFor="case_number" className="text-sm">Case Number</Label>
                <Input id="case_number" {...register('case_number')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="Case number..." />
              </div>

              <div>
                <Label htmlFor="filing_date" className="text-sm">Filing Date</Label>
                <Input id="filing_date" type="date" {...register('filing_date')} className="mt-1.5 bg-white border-slate-200 rounded-xl" />
              </div>

              <div>
                <Label htmlFor="court_name" className="text-sm">Court</Label>
                <Input id="court_name" {...register('court_name')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="Court name..." />
              </div>

              <div>
                <Label htmlFor="cnr_number" className="text-sm">CNR Number</Label>
                <Input id="cnr_number" {...register('cnr_number')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="CNR number..." />
              </div>

              <div>
                <Label htmlFor="filing_number" className="text-sm">Filing Number</Label>
                <Input id="filing_number" {...register('filing_number')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="Filing number..." />
              </div>

              <div>
                <Label htmlFor="district" className="text-sm">District</Label>
                <Input id="district" {...register('district')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="District..." />
              </div>
            </div>
          </div>

          {/* Parties Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Parties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="petitioner" className="text-sm">Petitioner</Label>
                <Input id="petitioner" {...register('petitioner')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="Petitioner name..." />
              </div>

              <div>
                <Label htmlFor="respondent" className="text-sm">Respondent</Label>
                <Input id="respondent" {...register('respondent')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="Respondent name..." />
              </div>

              <div>
                <Label htmlFor="advocate_name" className="text-sm">Advocate Name</Label>
                <Input id="advocate_name" {...register('advocate_name')} className="mt-1.5 bg-white border-slate-200 rounded-xl" placeholder="Advocate name..." />
              </div>
            </div>
          </div>

          {/* Assignment Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Assign Lawyers</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
              {lawyers.length === 0 ? <p className="text-slate-400 text-sm">No lawyers available</p> : lawyers.map(lawyer => <label key={lawyer.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded-lg active:scale-[0.98] transition-all">
                    <input type="checkbox" value={lawyer.id} {...register('assigned_users')} className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" />
                    <span className="text-sm text-slate-700">{lawyer.full_name}</span>
                    <span className="text-xs text-slate-400 capitalize">({lawyer.role})</span>
                  </label>)}
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Description</h3>
            <textarea id="description" {...register('description')} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm" rows={3} placeholder="Enter case description..." />
          </div>

          {/* Action Buttons - Sticky on mobile */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700">
              {isSubmitting ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>

        <FetchCaseDialog open={showFetchDialog} onClose={() => setShowFetchDialog(false)} onSuccess={handleFetchSuccess} preSelectedClientId={preSelectedClientId} />
      </div>
    </div>;
};