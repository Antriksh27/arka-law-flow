import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Briefcase, Users, Scale, MapPin, Hash, Calendar, BookOpen, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { ActsSelector } from './ActsSelector';

interface EditCaseDialogProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  caseData: any;
}

export const EditCaseDialog: React.FC<EditCaseDialogProps> = ({
  open,
  onClose,
  caseId,
  caseData
}) => {
  const [formData, setFormData] = useState({
    client_id: caseData?.client_id || '',
    reference_number: caseData?.reference_number || '',
    registration_number: caseData?.registration_number || '',
    status: caseData?.status || 'open',
    by_against: caseData?.by_against || '',
    stage: caseData?.stage || '',
    court_name: caseData?.court_name || '',
    court_complex: caseData?.court_complex || '',
    bench_type: caseData?.bench_type || '',
    judicial_branch: caseData?.judicial_branch || '',
    advocate_name: caseData?.advocate_name || '',
    petitioner: caseData?.petitioner || '',
    petitioner_advocate: caseData?.petitioner_advocate || '',
    respondent: caseData?.respondent || '',
    respondent_advocate: caseData?.respondent_advocate || '',
    state: caseData?.state || '',
    district: caseData?.district || '',
    state_1: caseData?.state_1 || '',
    district_1: caseData?.district_1 || '',
    case_number: caseData?.case_number || '',
    filing_number: caseData?.filing_number || '',
    cnr_number: caseData?.cnr_number || '',
    filing_date: caseData?.filing_date || '',
    registration_date: caseData?.registration_date || '',
    first_hearing_date: caseData?.first_hearing_date || '',
    next_hearing_date: caseData?.next_hearing_date || '',
    category: caseData?.category || '',
    sub_category: caseData?.sub_category || '',
    hearing_notes: caseData?.hearing_notes || '',
    objection: caseData?.objection || '',
    vs: caseData?.vs || '',
    description: caseData?.description || ''
  });
  
  const [acts, setActs] = useState<string[]>(caseData?.acts || []);
  const [sections, setSections] = useState<string[]>(caseData?.sections || []);
  const [orders, setOrders] = useState<string[]>(caseData?.orders || []);
  const [documentLinks, setDocumentLinks] = useState<string[]>(caseData?.document_links || []);
  const [newSection, setNewSection] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [newDocumentLink, setNewDocumentLink] = useState('');

  const queryClient = useQueryClient();

  const updateCaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const processedData = {
        ...data,
        filing_date: data.filing_date?.trim() || null,
        registration_date: data.registration_date?.trim() || null,
        first_hearing_date: data.first_hearing_date?.trim() || null,
        next_hearing_date: data.next_hearing_date?.trim() || null,
        acts,
        sections,
        orders,
        document_links: documentLinks,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('cases')
        .update(processedData)
        .eq('id', caseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-details-full', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-detail', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', caseId] });
      toast.success('Case updated successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Error updating case:', error);
      toast.error('Failed to update case');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCaseMutation.mutate(formData);
  };

  const addItem = (type: 'section' | 'order' | 'document', value: string) => {
    if (!value.trim()) return;
    
    switch (type) {
      case 'section':
        setSections([...sections, value]);
        setNewSection('');
        break;
      case 'order':
        setOrders([...orders, value]);
        setNewOrder('');
        break;
      case 'document':
        setDocumentLinks([...documentLinks, value]);
        setNewDocumentLink('');
        break;
    }
  };

  const removeItem = (type: 'section' | 'order' | 'document', index: number) => {
    switch (type) {
      case 'section':
        setSections(sections.filter((_, i) => i !== index));
        break;
      case 'order':
        setOrders(orders.filter((_, i) => i !== index));
        break;
      case 'document':
        setDocumentLinks(documentLinks.filter((_, i) => i !== index));
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="sm:max-w-4xl p-0 bg-muted overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Edit Case</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Update case information</p>
              </div>
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {/* Basic Case Info Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Basic Case Information</Label>
                    <p className="text-xs text-muted-foreground">Client, status, and case details</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Client</Label>
                    <ClientSelector
                      value={formData.client_id}
                      onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      placeholder="Select or add client..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Registration Number</Label>
                      <Input
                        value={formData.registration_number}
                        onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_court">In Court</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">By/Against</Label>
                      <Select 
                        value={formData.by_against} 
                        onValueChange={(value) => setFormData({ ...formData, by_against: value })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">Not specified</SelectItem>
                          <SelectItem value="by">By (Filed by client)</SelectItem>
                          <SelectItem value="against">Against (Filed against client)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Stage</Label>
                      <Input
                        value={formData.stage}
                        onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Case Title (VS)</Label>
                    <Input
                      value={formData.vs}
                      onChange={(e) => setFormData({ ...formData, vs: e.target.value })}
                      placeholder="e.g., Petitioner Vs Respondent"
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="bg-slate-50 border-slate-200 rounded-xl resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parties Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Parties Involved</Label>
                    <p className="text-xs text-muted-foreground">Petitioner and respondent details</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Petitioner</Label>
                      <Input
                        value={formData.petitioner}
                        onChange={(e) => setFormData({ ...formData, petitioner: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Respondent</Label>
                      <Input
                        value={formData.respondent}
                        onChange={(e) => setFormData({ ...formData, respondent: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Petitioner's Advocate</Label>
                      <Input
                        value={formData.petitioner_advocate}
                        onChange={(e) => setFormData({ ...formData, petitioner_advocate: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Respondent's Advocate</Label>
                      <Input
                        value={formData.respondent_advocate}
                        onChange={(e) => setFormData({ ...formData, respondent_advocate: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Court Information Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Court Information</Label>
                    <p className="text-xs text-muted-foreground">Court and jurisdiction details</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Court Name</Label>
                      <Input
                        value={formData.court_name}
                        onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Court Complex</Label>
                      <Input
                        value={formData.court_complex}
                        onChange={(e) => setFormData({ ...formData, court_complex: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Bench Type</Label>
                      <Input
                        value={formData.bench_type}
                        onChange={(e) => setFormData({ ...formData, bench_type: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Judicial Branch</Label>
                      <Input
                        value={formData.judicial_branch}
                        onChange={(e) => setFormData({ ...formData, judicial_branch: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Location</Label>
                    <p className="text-xs text-muted-foreground">State and district information</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">State</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">District</Label>
                      <Input
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">State (Secondary)</Label>
                      <Input
                        value={formData.state_1}
                        onChange={(e) => setFormData({ ...formData, state_1: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">District (Secondary)</Label>
                      <Input
                        value={formData.district_1}
                        onChange={(e) => setFormData({ ...formData, district_1: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Numbers Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Case Numbers & References</Label>
                    <p className="text-xs text-muted-foreground">Filing and registration numbers</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Reference Number</Label>
                      <Input
                        value={formData.reference_number}
                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Filing Number</Label>
                      <Input
                        value={formData.filing_number}
                        onChange={(e) => setFormData({ ...formData, filing_number: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Registration Number</Label>
                      <Input
                        value={formData.registration_number}
                        onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">CNR Number</Label>
                      <Input
                        value={formData.cnr_number}
                        onChange={(e) => setFormData({ ...formData, cnr_number: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Dates Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Important Dates</Label>
                    <p className="text-xs text-muted-foreground">Filing and hearing dates</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Filing Date</Label>
                    <Input
                      type="date"
                      value={formData.filing_date}
                      onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Registration Date</Label>
                    <Input
                      type="date"
                      value={formData.registration_date}
                      onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">First Hearing Date</Label>
                    <Input
                      type="date"
                      value={formData.first_hearing_date}
                      onChange={(e) => setFormData({ ...formData, first_hearing_date: e.target.value })}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Next Hearing Date</Label>
                    <Input
                      type="date"
                      value={formData.next_hearing_date}
                      onChange={(e) => setFormData({ ...formData, next_hearing_date: e.target.value })}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Legal References Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Legal References</Label>
                    <p className="text-xs text-muted-foreground">Acts, sections, and categories</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Category</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Sub Category</Label>
                      <Input
                        value={formData.sub_category}
                        onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Reference Acts</Label>
                    <ActsSelector value={acts} onChange={setActs} />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Sections</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                        placeholder="Add a section"
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addItem('section', newSection)}
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-teal-500 hover:bg-teal-600"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sections.map((section, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1 rounded-full px-3 py-1 bg-teal-50 text-teal-700 border-0">
                          {section}
                          <X className="w-3 h-3 cursor-pointer hover:text-teal-900" onClick={() => removeItem('section', index)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentation Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Documentation & Notes</Label>
                    <p className="text-xs text-muted-foreground">Hearing notes and orders</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Hearing Notes</Label>
                    <Textarea
                      value={formData.hearing_notes}
                      onChange={(e) => setFormData({ ...formData, hearing_notes: e.target.value })}
                      rows={3}
                      className="bg-slate-50 border-slate-200 rounded-xl resize-none"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Objection</Label>
                    <Textarea
                      value={formData.objection}
                      onChange={(e) => setFormData({ ...formData, objection: e.target.value })}
                      rows={2}
                      className="bg-slate-50 border-slate-200 rounded-xl resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Orders</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newOrder}
                        onChange={(e) => setNewOrder(e.target.value)}
                        placeholder="Add an order"
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addItem('order', newOrder)}
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-orange-500 hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {orders.map((order, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                          <span className="flex-1 text-sm text-slate-700">{order}</span>
                          <X className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeItem('order', index)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Document Links</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newDocumentLink}
                        onChange={(e) => setNewDocumentLink(e.target.value)}
                        placeholder="Add a document link"
                        type="url"
                        className="bg-slate-50 border-slate-200 rounded-xl h-11"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addItem('document', newDocumentLink)}
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-orange-500 hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {documentLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                          <span className="flex-1 text-sm text-slate-700 truncate">{link}</span>
                          <X className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeItem('document', index)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-full px-6 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateCaseMutation.isPending}
                className="rounded-full px-6 bg-slate-800 hover:bg-slate-700"
              >
                {updateCaseMutation.isPending ? 'Updating...' : 'Update Case'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
