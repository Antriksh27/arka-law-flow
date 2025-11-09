
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ClientSelector } from '@/components/appointments/ClientSelector';

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
  const [newAct, setNewAct] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [newDocumentLink, setNewDocumentLink] = useState('');

  const queryClient = useQueryClient();

  const updateCaseMutation = useMutation({
    mutationFn: async (data: any) => {
      // Process the form data to handle empty date strings
      const processedData = {
        ...data,
        // Convert empty strings to null for date fields
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
      
      // The database triggers will automatically log all the changes
      console.log('Case updated successfully, activity logs will be generated automatically');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-details-full', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-detail', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', caseId] }); // Refresh activity logs
      toast.success('Case updated successfully. All changes have been logged in the activity feed.');
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

  const addItem = (type: 'act' | 'section' | 'order' | 'document', value: string) => {
    if (!value.trim()) return;
    
    switch (type) {
      case 'act':
        setActs([...acts, value]);
        setNewAct('');
        break;
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

  const removeItem = (type: 'act' | 'section' | 'order' | 'document', index: number) => {
    switch (type) {
      case 'act':
        setActs(acts.filter((_, i) => i !== index));
        break;
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Case Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Client</Label>
                <ClientSelector
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  placeholder="Select or add client..."
                />
              </div>
              <div>
                <Label htmlFor="registration_number">Registration Number *</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_court">In Court</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="by_against">By/Against</Label>
                <Select 
                  value={formData.by_against} 
                  onValueChange={(value) => setFormData({ ...formData, by_against: value })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="">Not specified</SelectItem>
                    <SelectItem value="by">By (Filed by client)</SelectItem>
                    <SelectItem value="against">Against (Filed against client)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stage">Stage</Label>
                <Input
                  id="stage"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vs">Case Title (VS)</Label>
                <Input
                  id="vs"
                  value={formData.vs}
                  onChange={(e) => setFormData({ ...formData, vs: e.target.value })}
                  placeholder="e.g., Petitioner Vs Respondent"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-slate-50"
              />
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Parties Involved</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="petitioner">Petitioner</Label>
                <Input
                  id="petitioner"
                  value={formData.petitioner}
                  onChange={(e) => setFormData({ ...formData, petitioner: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="respondent">Respondent</Label>
                <Input
                  id="respondent"
                  value={formData.respondent}
                  onChange={(e) => setFormData({ ...formData, respondent: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="petitioner_advocate">Petitioner's Advocate</Label>
                <Input
                  id="petitioner_advocate"
                  value={formData.petitioner_advocate}
                  onChange={(e) => setFormData({ ...formData, petitioner_advocate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="respondent_advocate">Respondent's Advocate</Label>
                <Input
                  id="respondent_advocate"
                  value={formData.respondent_advocate}
                  onChange={(e) => setFormData({ ...formData, respondent_advocate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Court Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Court Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="court_name">Court Name</Label>
                <Input
                  id="court_name"
                  value={formData.court_name}
                  onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="court_complex">Court Complex</Label>
                <Input
                  id="court_complex"
                  value={formData.court_complex}
                  onChange={(e) => setFormData({ ...formData, court_complex: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bench_type">Bench Type</Label>
                <Input
                  id="bench_type"
                  value={formData.bench_type}
                  onChange={(e) => setFormData({ ...formData, bench_type: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="judicial_branch">Judicial Branch</Label>
                <Input
                  id="judicial_branch"
                  value={formData.judicial_branch}
                  onChange={(e) => setFormData({ ...formData, judicial_branch: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state_1">State (Secondary)</Label>
                <Input
                  id="state_1"
                  value={formData.state_1}
                  onChange={(e) => setFormData({ ...formData, state_1: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="district_1">District (Secondary)</Label>
                <Input
                  id="district_1"
                  value={formData.district_1}
                  onChange={(e) => setFormData({ ...formData, district_1: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Case Numbers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Case Numbers & References</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference_number">Reference Number (Internal)</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="Internal case reference number"
                />
              </div>
              <div>
                <Label htmlFor="filing_number">Filing Number</Label>
                <Input
                  id="filing_number"
                  value={formData.filing_number}
                  onChange={(e) => setFormData({ ...formData, filing_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cnr_number">CNR Number</Label>
                <Input
                  id="cnr_number"
                  value={formData.cnr_number}
                  onChange={(e) => setFormData({ ...formData, cnr_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="filing_date">Filing Date</Label>
                <Input
                  id="filing_date"
                  type="date"
                  value={formData.filing_date}
                  onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="registration_date">Registration Date</Label>
                <Input
                  id="registration_date"
                  type="date"
                  value={formData.registration_date}
                  onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="first_hearing_date">First Hearing Date</Label>
                <Input
                  id="first_hearing_date"
                  type="date"
                  value={formData.first_hearing_date}
                  onChange={(e) => setFormData({ ...formData, first_hearing_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="next_hearing_date">Next Hearing Date</Label>
                <Input
                  id="next_hearing_date"
                  type="date"
                  value={formData.next_hearing_date}
                  onChange={(e) => setFormData({ ...formData, next_hearing_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Legal References */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal References</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sub_category">Sub Category</Label>
                <Input
                  id="sub_category"
                  value={formData.sub_category}
                  onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                />
              </div>
            </div>

            {/* Acts */}
            <div>
              <Label>Acts</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newAct}
                  onChange={(e) => setNewAct(e.target.value)}
                  placeholder="Add an act"
                />
                <Button type="button" onClick={() => addItem('act', newAct)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {acts.map((act, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {act}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('act', index)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div>
              <Label>Sections</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="Add a section"
                />
                <Button type="button" onClick={() => addItem('section', newSection)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {sections.map((section, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {section}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('section', index)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documentation & Notes</h3>
            <div>
              <Label htmlFor="hearing_notes">Hearing Notes</Label>
              <Textarea
                id="hearing_notes"
                value={formData.hearing_notes}
                onChange={(e) => setFormData({ ...formData, hearing_notes: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="objection">Objection</Label>
              <Textarea
                id="objection"
                value={formData.objection}
                onChange={(e) => setFormData({ ...formData, objection: e.target.value })}
                rows={3}
              />
            </div>

            {/* Orders */}
            <div>
              <Label>Orders</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newOrder}
                  onChange={(e) => setNewOrder(e.target.value)}
                  placeholder="Add an order"
                />
                <Button type="button" onClick={() => addItem('order', newOrder)}>Add</Button>
              </div>
              <div className="space-y-1">
                {orders.map((order, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{order}</span>
                    <X className="w-4 h-4 cursor-pointer text-red-500" onClick={() => removeItem('order', index)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Document Links */}
            <div>
              <Label>Document Links</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newDocumentLink}
                  onChange={(e) => setNewDocumentLink(e.target.value)}
                  placeholder="Add a document link"
                  type="url"
                />
                <Button type="button" onClick={() => addItem('document', newDocumentLink)}>Add</Button>
              </div>
              <div className="space-y-1">
                {documentLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{link}</span>
                    <X className="w-4 h-4 cursor-pointer text-red-500" onClick={() => removeItem('document', index)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCaseMutation.isPending}>
              {updateCaseMutation.isPending ? 'Updating...' : 'Update Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
