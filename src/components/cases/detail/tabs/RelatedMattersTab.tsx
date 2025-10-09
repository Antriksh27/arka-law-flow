import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ExternalLink, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RelatedMattersTabProps {
  caseId: string;
}

export const RelatedMattersTab: React.FC<RelatedMattersTabProps> = ({ caseId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Fetch related cases
  const { data: relatedCases, isLoading } = useQuery({
    queryKey: ['related-cases', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_relations')
        .select('*, related_case:cases!case_relations_related_case_id_fkey(id, case_title, case_number, status)')
        .eq('case_id', caseId);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all available cases to link
  const { data: availableCases } = useQuery({
    queryKey: ['available-cases', caseId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return [];

      const { data: firmData } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', userData.user.id)
        .single();

      if (!firmData) return [];

      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number')
        .eq('firm_id', firmData.firm_id)
        .neq('id', caseId)
        .order('case_title');
      
      if (error) throw error;
      return data;
    }
  });

  const addRelationMutation = useMutation({
    mutationFn: async (relatedCaseId: string) => {
      const { data, error } = await supabase
        .from('case_relations')
        .insert([{ case_id: caseId, related_case_id: relatedCaseId }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-cases', caseId] });
      toast.success('Related case linked successfully');
      setIsAddDialogOpen(false);
      setSelectedCaseId('');
    },
    onError: () => {
      toast.error('Failed to link related case');
    }
  });

  const deleteRelationMutation = useMutation({
    mutationFn: async (relationId: string) => {
      const { error } = await supabase
        .from('case_relations')
        .delete()
        .eq('id', relationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-cases', caseId] });
      toast.success('Related case unlinked successfully');
    },
    onError: () => {
      toast.error('Failed to unlink related case');
    }
  });

  const handleAddRelation = () => {
    if (!selectedCaseId) return;
    addRelationMutation.mutate(selectedCaseId);
  };

  // Filter cases based on search query
  const filteredCases = useMemo(() => {
    if (!availableCases) return [];
    if (!searchQuery.trim()) return availableCases;
    
    const query = searchQuery.toLowerCase();
    return availableCases.filter(c => 
      c.case_title.toLowerCase().includes(query) ||
      (c.case_number && c.case_number.toLowerCase().includes(query))
    );
  }, [availableCases, searchQuery]);

  if (isLoading) {
    return <div className="p-6">Loading related matters...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Related Matters</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Link Case
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Related Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Search Case</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Type to search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              {searchQuery && (
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  {filteredCases.length > 0 ? (
                    <div className="divide-y">
                      {filteredCases.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setSearchQuery(c.case_title);
                          }}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                            selectedCaseId === c.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="font-medium text-sm">{c.case_title}</p>
                          {c.case_number && (
                            <p className="text-xs text-gray-500 mt-1">Case #: {c.case_number}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No cases found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setSearchQuery('');
                    setSelectedCaseId('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddRelation} 
                  disabled={!selectedCaseId || addRelationMutation.isPending}
                >
                  {addRelationMutation.isPending ? 'Linking...' : 'Link Case'}
                </Button>
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
                    <h4 className="font-semibold text-base">{relation.related_case?.case_title}</h4>
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
                  onClick={() => deleteRelationMutation.mutate(relation.id)}
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
