import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, ExternalLink, Trash2, Search, Loader2, Link2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface RelatedMattersTabProps {
  caseId: string;
}

export const RelatedMattersTab: React.FC<RelatedMattersTabProps> = ({ caseId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { firmId } = useAuth();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryClient = useQueryClient();

  // Helper function to get display title exactly like Cases list
  const getDisplayTitle = (caseData: any) => {
    let displayTitle = caseData.case_title || '';

    if (caseData.petitioner && caseData.respondent) {
      // Match CasesTable logic: strip advocate info and use "Petitioner Vs Respondent"
      const cleanPetitioner = String(caseData.petitioner).replace(/\s*Advocate[:\s].*/gi, '').trim();
      const cleanRespondent = String(caseData.respondent).replace(/\s*Advocate[:\s].*/gi, '').trim();
      displayTitle = `${cleanPetitioner} Vs ${cleanRespondent}`;
    }

    return displayTitle || caseData.case_number || '';
  };

  // Fetch related cases (both directions)
  const { data: relatedCases, isLoading } = useQuery({
    queryKey: ['related-cases', caseId],
    queryFn: async () => {
      // Fetch relations where this case is the primary case
      const { data: forwardRelations, error: forwardError } = await supabase
        .from('case_relations')
        .select('id, related_case_id, related_case:cases!case_relations_related_case_id_fkey(id, case_title, case_number, status, petitioner, respondent, vs)')
        .eq('case_id', caseId);
      
      if (forwardError) throw forwardError;

      // Fetch relations where this case is the related case (reverse direction)
      const { data: reverseRelations, error: reverseError } = await supabase
        .from('case_relations')
        .select('id, case_id, related_case:cases!case_relations_case_id_fkey(id, case_title, case_number, status, petitioner, respondent, vs)')
        .eq('related_case_id', caseId);
      
      if (reverseError) throw reverseError;

      // Combine and deduplicate
      const allRelations = [
        ...(forwardRelations || []),
        ...(reverseRelations || []).map(r => ({
          id: r.id,
          related_case_id: r.case_id,
          related_case: r.related_case
        }))
      ];

      // Remove duplicates based on related case ID
      const uniqueRelations = allRelations.filter((relation, index, self) =>
        index === self.findIndex(r => r.related_case?.id === relation.related_case?.id)
      );

      return uniqueRelations;
    }
  });

  // Search cases with server-side filtering for better performance
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['search-cases-for-linking', firmId, caseId, debouncedSearch],
    queryFn: async () => {
      if (!firmId) return [];
      if (!debouncedSearch.trim()) return [];

      const searchTerm = `%${debouncedSearch.trim()}%`;
      
      // Search across multiple fields using OR conditions
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number, petitioner, respondent, vs, cnr_number, registration_number, filing_number, reference_number')
        .eq('firm_id', firmId)
        .neq('id', caseId)
        .or(`case_title.ilike.${searchTerm},case_number.ilike.${searchTerm},cnr_number.ilike.${searchTerm},registration_number.ilike.${searchTerm},filing_number.ilike.${searchTerm},reference_number.ilike.${searchTerm},petitioner.ilike.${searchTerm},respondent.ilike.${searchTerm}`)
        .order('case_title')
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId && !!debouncedSearch.trim()
  });

  const addRelationMutation = useMutation({
    mutationFn: async (relatedCaseId: string) => {
      // Check if relation already exists in either direction
      const { data: existing } = await supabase
        .from('case_relations')
        .select('id')
        .or(`and(case_id.eq.${caseId},related_case_id.eq.${relatedCaseId}),and(case_id.eq.${relatedCaseId},related_case_id.eq.${caseId})`);

      if (existing && existing.length > 0) {
        throw new Error('Cases are already linked');
      }

      // Create two-way link
      const { error } = await supabase
        .from('case_relations')
        .insert([
          { case_id: caseId, related_case_id: relatedCaseId },
          { case_id: relatedCaseId, related_case_id: caseId }
        ]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-cases'] });
      toast.success('Cases linked successfully (two-way)');
      setIsAddDialogOpen(false);
      setSelectedCaseId('');
      setSearchQuery('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to link related case');
    }
  });

  const deleteRelationMutation = useMutation({
    mutationFn: async (relatedCaseId: string) => {
      // Delete both directions of the link
      const { error } = await supabase
        .from('case_relations')
        .delete()
        .or(`and(case_id.eq.${caseId},related_case_id.eq.${relatedCaseId}),and(case_id.eq.${relatedCaseId},related_case_id.eq.${caseId})`);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-cases'] });
      toast.success('Cases unlinked successfully (two-way)');
    },
    onError: () => {
      toast.error('Failed to unlink related case');
    }
  });

  const handleAddRelation = () => {
    if (!selectedCaseId) return;
    addRelationMutation.mutate(selectedCaseId);
  };

  // Use server-side search results directly
  const filteredCases = searchResults;

  if (isLoading) {
    return <div className="p-6">Loading related matters...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Related Matters</h3>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Link Case
        </Button>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent hideCloseButton className="sm:max-w-lg p-0 bg-slate-50 overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-5 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">Link Related Case</h2>
                      <p className="text-sm text-muted-foreground">Search and connect related matters</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSearchQuery('');
                      setSelectedCaseId('');
                    }}
                    className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Search className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Search Case</p>
                      <p className="text-xs text-muted-foreground">
                        By name, CNR, registration, or filing number
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Type to search cases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 rounded-xl border-slate-200"
                    />
                  </div>
                </div>
                
                {/* Search Results */}
                {searchQuery && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {isSearching ? (
                      <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </div>
                    ) : filteredCases.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {filteredCases.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCaseId(c.id);
                              setSearchQuery(getDisplayTitle(c));
                            }}
                            className={`w-full text-left p-4 transition-colors active:scale-[0.99] ${
                              selectedCaseId === c.id 
                                ? 'bg-sky-50 border-l-4 border-l-sky-500' 
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <p className="font-medium text-sm text-slate-800">{getDisplayTitle(c)}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              {c.case_number && (
                                <p className="text-xs text-muted-foreground">Case #: {c.case_number}</p>
                              )}
                              {c.cnr_number && (
                                <p className="text-xs text-muted-foreground">CNR: {c.cnr_number}</p>
                              )}
                              {c.registration_number && (
                                <p className="text-xs text-muted-foreground">Reg: {c.registration_number}</p>
                              )}
                              {c.filing_number && (
                                <p className="text-xs text-muted-foreground">Filing: {c.filing_number}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : debouncedSearch ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No cases found matching "{searchQuery}"
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        Type at least one character to search
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Case Indicator */}
                {selectedCaseId && (
                  <div className="p-3 bg-sky-50 rounded-xl">
                    <p className="text-sm text-sky-700 font-medium">
                      Ready to link selected case
                    </p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-white border-t border-slate-100">
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSearchQuery('');
                      setSelectedCaseId('');
                    }}
                    className="rounded-full px-6 border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddRelation} 
                    disabled={!selectedCaseId || addRelationMutation.isPending}
                    className="rounded-full px-6 bg-sky-500 hover:bg-sky-600"
                  >
                    {addRelationMutation.isPending ? 'Linking...' : 'Link Case'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {relatedCases && relatedCases.length > 0 ? (
        <div className="grid gap-4">
          {relatedCases.map((relation) => (
            <div key={relation.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-base">{getDisplayTitle(relation.related_case)}</h4>
                    {relation.related_case?.status && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                        {relation.related_case.status}
                      </span>
                    )}
                  </div>
                  {relation.related_case?.case_number && (
                    <p className="text-sm text-gray-600 mb-2">Case #: {relation.related_case.case_number}</p>
                  )}
                  <Link
                    to={`/cases/${relation.related_case?.id}`}
                    className="text-sm text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                  >
                    View Case <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRelationMutation.mutate(relation.related_case_id)}
                  disabled={deleteRelationMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No related matters linked</p>
          <p className="text-sm mt-1">Click "Link Case" to connect related matters</p>
        </div>
      )}
    </div>
  );
};
