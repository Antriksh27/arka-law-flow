import React, { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, FileText, Calendar, Briefcase, ListTodo, File, Receipt } from 'lucide-react';
import { AuditLogger } from '@/lib/auditLogger';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeleteClientDialogProps {
  clientId: string | null;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const DeleteClientDialog = ({ clientId, clientName, open, onOpenChange, onSuccess }: DeleteClientDialogProps) => {
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all related data
  const { data: relatedData, isLoading } = useQuery({
    queryKey: ['client-related-data', clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const [casesResult, appointmentsResult, notesResult, tasksResult, documentsResult, invoicesResult] = await Promise.all([
        supabase.from('cases').select('id, case_title, case_number').eq('client_id', clientId),
        supabase.from('appointments').select('id, title, start_time').eq('client_id', clientId),
        supabase.from('notes_v2').select('id, title').eq('client_id', clientId),
        supabase.from('tasks').select('id, title').eq('client_id', clientId),
        supabase.from('documents').select('id, file_name').eq('client_id', clientId),
        supabase.from('invoices').select('id, invoice_number').eq('client_id', clientId)
      ]);

      return {
        cases: casesResult.data || [],
        appointments: appointmentsResult.data || [],
        notes: notesResult.data || [],
        tasks: tasksResult.data || [],
        documents: documentsResult.data || [],
        invoices: invoicesResult.data || []
      };
    },
    enabled: !!clientId && open
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error('No client ID');

      // Delete in the correct order (child records first)
      if (relatedData?.notes && relatedData.notes.length > 0) {
        const { error: notesError } = await supabase
          .from('notes_v2')
          .delete()
          .eq('client_id', clientId);
        if (notesError) throw notesError;
      }

      if (relatedData?.tasks && relatedData.tasks.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('client_id', clientId);
        if (tasksError) throw tasksError;
      }

      if (relatedData?.documents && relatedData.documents.length > 0) {
        const { error: docsError } = await supabase
          .from('documents')
          .delete()
          .eq('client_id', clientId);
        if (docsError) throw docsError;
      }

      if (relatedData?.invoices && relatedData.invoices.length > 0) {
        const { error: invoicesError } = await supabase
          .from('invoices')
          .delete()
          .eq('client_id', clientId);
        if (invoicesError) throw invoicesError;
      }

      if (relatedData?.cases && relatedData.cases.length > 0) {
        const caseIds = relatedData.cases.map(c => c.id);

        await Promise.all([
          supabase.from('case_activities').delete().in('case_id', caseIds),
          supabase.from('case_contacts').delete().in('case_id', caseIds),
          supabase.from('case_documents').delete().in('case_id', caseIds),
          supabase.from('case_hearings').delete().in('case_id', caseIds),
          supabase.from('case_objections').delete().in('case_id', caseIds),
          supabase.from('case_orders').delete().in('case_id', caseIds),
          supabase.from('case_relations').delete().in('case_id', caseIds),
          supabase.from('case_emails').delete().in('case_id', caseIds),
          supabase.from('case_files').delete().in('case_id', caseIds),
          supabase.from('case_notes').delete().in('case_id', caseIds),
          supabase.from('court_hearings').delete().in('case_id', caseIds)
        ]);
      }

      if (relatedData?.cases && relatedData.cases.length > 0) {
        const { error: casesError } = await supabase
          .from('cases')
          .delete()
          .eq('client_id', clientId);
        if (casesError) throw casesError;
      }

      if (relatedData?.appointments && relatedData.appointments.length > 0) {
        const { error: appointmentsError } = await supabase
          .from('appointments')
          .delete()
          .eq('client_id', clientId);
        if (appointmentsError) throw appointmentsError;
      }

      const { data: deletedClient, error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .select('id')
        .maybeSingle();
      if (clientError) throw clientError;
      if (!deletedClient) {
        throw new Error('Client was not deleted. It may not exist anymore or you may not have permission.');
      }

      await AuditLogger.logDataAccess('client', 'delete', clientId, {
        client_name: clientName,
        deleted_cases: relatedData?.cases?.length || 0,
        deleted_appointments: relatedData?.appointments?.length || 0,
        deleted_notes: relatedData?.notes?.length || 0,
        deleted_tasks: relatedData?.tasks?.length || 0,
        deleted_documents: relatedData?.documents?.length || 0,
        deleted_invoices: relatedData?.invoices?.length || 0
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${clientName} and all related data deleted successfully`
      });
      
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-related-data'] });
      
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "No client ID available for deletion",
        variant: "destructive"
      });
      return;
    }
    deleteMutation.mutate();
  };

  const totalItems = (relatedData?.cases?.length || 0) + (relatedData?.appointments?.length || 0) + (relatedData?.notes?.length || 0) + (relatedData?.tasks?.length || 0) + (relatedData?.documents?.length || 0) + (relatedData?.invoices?.length || 0);

  const dataCategories = [
    { key: 'cases', icon: Briefcase, label: 'Cases', color: 'blue', data: relatedData?.cases, titleField: 'case_title', subtitleField: 'case_number' },
    { key: 'notes', icon: FileText, label: 'Notes', color: 'violet', data: relatedData?.notes, titleField: 'title' },
    { key: 'tasks', icon: ListTodo, label: 'Tasks', color: 'indigo', data: relatedData?.tasks, titleField: 'title' },
    { key: 'documents', icon: File, label: 'Documents', color: 'slate', data: relatedData?.documents, titleField: 'file_name' },
    { key: 'invoices', icon: Receipt, label: 'Invoices', color: 'amber', data: relatedData?.invoices, titleField: 'invoice_number' },
    { key: 'appointments', icon: Calendar, label: 'Appointments', color: 'emerald', data: relatedData?.appointments, titleField: 'title', subtitleField: 'start_time' },
  ];

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Delete Client"
        subtitle={clientName}
        onClose={handleClose}
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        showBorder
      />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Warning Card */}
              <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-800">This action cannot be undone</p>
                    <p className="text-xs text-red-700 mt-1">
                      The following data will be permanently deleted:
                    </p>
                  </div>
                </div>
              </div>

              {totalItems === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-border/50">
                  <p className="text-sm text-slate-600">
                    No related data found. Only the client record will be deleted.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dataCategories.map(({ key, icon: Icon, label, color, data, titleField, subtitleField }) => {
                    if (!data || data.length === 0) return null;
                    
                    return (
                      <div key={key} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50">
                        <div className="p-3">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-9 h-9 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                              <Icon className={`w-4 h-4 text-${color}-500`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{label}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{data.length} item{data.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {data.slice(0, 5).map((item: any) => (
                              <div key={item.id} className="p-2 rounded-xl bg-slate-50 text-[11px] border border-slate-100">
                                <p className="font-bold text-slate-800 truncate">
                                  {item[titleField] || `Untitled ${label.slice(0, -1)}`}
                                </p>
                                {subtitleField && item[subtitleField] && (
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                                    {subtitleField === 'start_time' 
                                      ? new Date(item[subtitleField]).toLocaleDateString()
                                      : item[subtitleField]
                                    }
                                  </p>
                                )}
                              </div>
                            ))}
                            {data.length > 5 && (
                              <p className="text-[10px] text-slate-500 italic px-2 font-medium">
                                + {data.length - 5} more {label.toLowerCase()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary */}
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-xs text-amber-800 font-medium">
                      <span className="font-bold">Total items to be deleted:</span> {totalItems} record{totalItems !== 1 ? 's' : ''} plus all associated data
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 rounded-full h-12 font-semibold text-slate-600 border-slate-200 hover:bg-slate-50" 
          disabled={deleteMutation.isPending}
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleDelete}
          disabled={isLoading || !clientId || deleteMutation.isPending}
          variant="destructive"
          className="flex-1 rounded-full h-12 font-bold shadow-lg"
        >
          {deleteMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        {fullFormView}
      </AlertDialogContent>
    </AlertDialog>
  );
};
