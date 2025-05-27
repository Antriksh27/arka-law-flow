
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { AddCaseDialog } from '@/components/cases/AddCaseDialog';
import { Plus, FileText, ArrowLeft, Search } from 'lucide-react';

interface AssignToCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
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

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['all-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          title,
          status,
          case_type,
          created_at,
          client_id,
          clients(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: view === 'existing'
  });

  // Filter cases based on search query
  const filteredCases = cases.filter(case_item =>
    case_item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    case_item.case_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (case_item.clients?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignToCase = async (caseId: string) => {
    try {
      const { error } = await supabase
        .from('cases')
        .update({ client_id: clientId })
        .eq('id', caseId);

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
        return 'bg-blue-100 text-blue-800';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] bg-white flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">
              {view === 'selection' && `Link ${clientName} to Case`}
              {view === 'existing' && 'Select Existing Case'}
              {view === 'new' && 'Create New Case'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {view === 'selection' && (
              <div className="space-y-4 py-6">
                <Button
                  onClick={() => setView('existing')}
                  className="w-full h-20 flex items-center justify-start gap-4 text-left bg-white border border-gray-200 hover:bg-gray-50 text-gray-900"
                  variant="outline"
                >
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-lg font-medium">Link Existing Case</div>
                    <div className="text-sm text-gray-500">Choose from existing cases in your system</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setShowAddCaseDialog(true)}
                  className="w-full h-20 flex items-center justify-start gap-4 text-left bg-white border border-gray-200 hover:bg-gray-50 text-gray-900"
                  variant="outline"
                >
                  <Plus className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-lg font-medium">Add New Case</div>
                    <div className="text-sm text-gray-500">Create a new case for this client</div>
                  </div>
                </Button>
              </div>
            )}

            {view === 'existing' && (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setView('selection')}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </div>

                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search cases by title, type, or client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full w-full rounded-md border">
                    <div className="p-4">
                      {isLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          Loading cases...
                        </div>
                      ) : filteredCases.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {searchQuery ? 'No cases found matching your search' : 'No cases found'}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredCases.map((case_item) => (
                            <div
                              key={case_item.id}
                              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => handleAssignToCase(case_item.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900 mb-2">
                                    {case_item.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <Badge
                                      variant="secondary"
                                      className={getStatusColor(case_item.status)}
                                    >
                                      {case_item.status?.replace('_', ' ')}
                                    </Badge>
                                    <span className="capitalize">{case_item.case_type}</span>
                                    {case_item.clients && (
                                      <span>Current client: {case_item.clients.full_name}</span>
                                    )}
                                  </div>
                                </div>
                                <Button size="sm" variant="outline">
                                  Link Case
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddCaseDialog
        open={showAddCaseDialog}
        onClose={handleNewCaseSuccess}
        preSelectedClientId={clientId}
      />
    </>
  );
};
