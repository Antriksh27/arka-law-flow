import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AddCaseDialog } from '@/components/cases/AddCaseDialog';
import { Plus, FileText, ArrowLeft, Search, Link2, X, Briefcase, Loader2 } from 'lucide-react';
interface AssignToCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}
interface CaseItem {
  id: string;
  case_title: string;
  status: string;
  case_type: string;
  created_at: string;
  client_id: string | null;
  case_number: string | null;
  cnr_number: string | null;
  clients: {
    full_name: string;
  } | null;
}
export const AssignToCaseDialog: React.FC<AssignToCaseDialogProps> = ({
  open,
  onOpenChange,
  clientId,
  clientName
}) => {
  const [view, setView] = useState<'selection' | 'existing' | 'new'>('selection');
  const [showAddCaseDialog, setShowAddCaseDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Server-side search function - only search when 4+ characters typed
  const searchCases = useCallback(async (searchTerm: string) => {
    // Require at least 4 characters to search
    if (!searchTerm || searchTerm.trim().length < 4) {
      setCases([]);
      return;
    }
    
    setIsLoading(true);
    const term = searchTerm.trim();
    
    // Note: case_type is an enum, so we can't use ilike on it
    const { data, error } = await supabase
      .from('cases')
      .select(`
        id,
        case_title,
        status,
        case_type,
        created_at,
        client_id,
        case_number,
        cnr_number,
        clients(full_name)
      `)
      .or(`case_title.ilike.%${term}%,case_number.ilike.%${term}%,cnr_number.ilike.%${term}%,petitioner.ilike.%${term}%,respondent.ilike.%${term}%,registration_number.ilike.%${term}%,filing_number.ilike.%${term}%,reference_number.ilike.%${term}%`)
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (!error && data) {
      setCases(data as CaseItem[]);
    }
    setIsLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    if (view !== 'existing') return;
    const timer = setTimeout(() => {
      searchCases(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchCases, view]);

  // Reset cases when view changes
  useEffect(() => {
    if (view === 'existing') {
      setCases([]);
      setSearchQuery('');
    }
  }, [view]);
  const handleAssignToCase = async (caseId: string) => {
    try {
      const {
        error
      } = await supabase.from('cases').update({
        client_id: clientId
      }).eq('id', caseId);
      if (error) throw error;
      onOpenChange(false);
      setView('selection');
    } catch (error) {
      console.error('Error assigning client to case:', error);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'in_court':
        return 'bg-blue-100 text-blue-700';
      case 'on_hold':
        return 'bg-orange-100 text-orange-700';
      case 'closed':
      case 'disposed':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };
  const handleClose = () => {
    onOpenChange(false);
    setView('selection');
    setSearchQuery('');
  };
  const handleNewCaseSuccess = () => {
    setShowAddCaseDialog(false);
    handleClose();
  };
  return <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
          <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="px-6 py-5 bg-white border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {view !== 'selection' && <button onClick={() => setView('selection')} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>}
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {view === 'selection' && 'Link to Case'}
                      {view === 'existing' && 'Select Case'}
                    </h2>
                    <p className="text-sm text-muted-foreground">{clientName}</p>
                  </div>
                </div>
                <button onClick={handleClose} className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50">
              {view === 'selection' && <div className="space-y-3">
                  {/* Link Existing Case Option */}
                  <button onClick={() => setView('existing')} className="w-full bg-white rounded-2xl shadow-sm p-5 text-left hover:shadow-md transition-shadow active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-sky-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-foreground">Link Existing Case</p>
                        <p className="text-sm text-muted-foreground">Choose from existing cases in your system</p>
                      </div>
                    </div>
                  </button>

                  {/* Add New Case Option */}
                  <button onClick={() => setShowAddCaseDialog(true)} className="w-full bg-white rounded-2xl shadow-sm p-5 text-left hover:shadow-md transition-shadow active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <Plus className="w-7 h-7 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-foreground">Add New Case</p>
                        <p className="text-sm text-muted-foreground">Create a new case for this client</p>
                      </div>
                    </div>
                  </button>
                </div>}

              {view === 'existing' && <div className="space-y-4">
                  {/* Search */}
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Search className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Search Cases</p>
                          <p className="text-xs text-muted-foreground">Find by title, type, or client</p>
                        </div>
                      </div>
                      <Input placeholder="Search cases..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl h-11" />
                    </div>
                  </div>

                  {/* Cases List */}
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {searchQuery.trim().length < 4 ? 'Search Results' : 'Available Cases'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {searchQuery.trim().length < 4 
                              ? 'Type at least 4 characters to search' 
                              : `${cases.length} case${cases.length !== 1 ? 's' : ''} found`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {isLoading ? <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Searching cases...
                          </div> : searchQuery.trim().length < 4 ? <div className="text-center py-8 text-muted-foreground">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p>Enter at least 4 characters to search</p>
                          </div> : cases.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                            {searchQuery.trim() ? 'No cases found matching your search' : 'No cases available'}
                          </div> : cases.map(case_item => <div key={case_item.id} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors" onClick={() => handleAssignToCase(case_item.id)}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate mb-1">
                                    {case_item.case_title}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`${getStatusColor(case_item.status)} border-0 rounded-full px-2 py-0.5 text-xs`}>
                                      {case_item.status?.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground capitalize">{case_item.case_type}</span>
                                    {case_item.clients && <span className="text-xs text-muted-foreground">• {case_item.clients.full_name}</span>}
                                  </div>
                                </div>
                                <Button size="sm" className="rounded-full flex-shrink-0">
                                  Link
                                </Button>
                              </div>
                            </div>)}
                      </div>
                    </div>
                  </div>
                </div>}
            </div>

            {/* Footer */}
            {view === 'selection' && <div className="px-6 py-4 bg-white border-t border-slate-100">
                <Button variant="outline" onClick={handleClose} className="w-full rounded-full border-slate-200">
                  Cancel
                </Button>
              </div>}
          </div>
        </DialogContent>
      </Dialog>

      <AddCaseDialog open={showAddCaseDialog} onClose={handleNewCaseSuccess} preSelectedClientId={clientId} />
    </>;
};