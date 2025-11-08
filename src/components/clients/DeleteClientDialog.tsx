import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, FileText, Calendar, Briefcase, ListTodo, File, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AuditLogger } from '@/lib/auditLogger';

interface DeleteClientDialogProps {
  clientId: string | null;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const DeleteClientDialog = ({ clientId, clientName, open, onOpenChange, onSuccess }: DeleteClientDialogProps) => {
  const { toast } = useToast();

  // Debug logging
  console.log('DeleteClientDialog props:', { clientId, clientName, open });

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
      console.log('Delete mutation started with clientId:', clientId);
      
      if (!clientId) {
        console.error('No client ID provided to delete mutation');
        throw new Error('No client ID');
      }

      // Delete in the correct order (child records first)
      
      // 1. Delete notes associated with the client
      if (relatedData?.notes && relatedData.notes.length > 0) {
        const { error: notesError } = await supabase
          .from('notes_v2')
          .delete()
          .eq('client_id', clientId);
        if (notesError) throw notesError;
      }

      // 2. Delete tasks associated with the client
      if (relatedData?.tasks && relatedData.tasks.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('client_id', clientId);
        if (tasksError) throw tasksError;
      }

      // 3. Delete documents associated with the client
      if (relatedData?.documents && relatedData.documents.length > 0) {
        const { error: docsError } = await supabase
          .from('documents')
          .delete()
          .eq('client_id', clientId);
        if (docsError) throw docsError;
      }

      // 4. Delete invoices associated with the client
      if (relatedData?.invoices && relatedData.invoices.length > 0) {
        const { error: invoicesError } = await supabase
          .from('invoices')
          .delete()
          .eq('client_id', clientId);
        if (invoicesError) throw invoicesError;
      }

      // 5. Delete case-related records for each case
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

      // 3. Delete cases
      if (relatedData?.cases && relatedData.cases.length > 0) {
        const { error: casesError } = await supabase
          .from('cases')
          .delete()
          .eq('client_id', clientId);
        if (casesError) throw casesError;
      }

      // 4. Delete appointments
      if (relatedData?.appointments && relatedData.appointments.length > 0) {
        const { error: appointmentsError } = await supabase
          .from('appointments')
          .delete()
          .eq('client_id', clientId);
        if (appointmentsError) throw appointmentsError;
      }

      // 5. Finally, delete the client
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (clientError) throw clientError;

      // Log the deletion
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
      onOpenChange(false);
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
    console.log('handleDelete called with clientId:', clientId);
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Client - {clientName}
          </AlertDialogTitle>
          <div className="text-left space-y-4 text-sm text-gray-600 mt-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ This action cannot be undone. The following data will be permanently deleted:
                  </p>
                </div>

                {totalItems === 0 ? (
                  <div className="text-center py-4 text-gray-600">
                    No related data found. Only the client record will be deleted.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cases */}
                    {relatedData?.cases && relatedData.cases.length > 0 && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">
                            Cases ({relatedData.cases.length})
                          </h4>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {relatedData.cases.slice(0, 10).map((case_) => (
                            <div key={case_.id} className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <div className="font-medium">{case_.case_title}</div>
                              {case_.case_number && (
                                <div className="text-xs text-gray-500">{case_.case_number}</div>
                              )}
                            </div>
                          ))}
                          {relatedData.cases.length > 10 && (
                            <div className="text-xs text-gray-500 italic">
                              + {relatedData.cases.length - 10} more cases
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
                          This includes all case documents, hearings, orders, objections, contacts, and activities.
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {relatedData?.notes && relatedData.notes.length > 0 && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">
                            Notes ({relatedData.notes.length})
                          </h4>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {relatedData.notes.slice(0, 10).map((note) => (
                            <div key={note.id} className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <div className="font-medium">{note.title || 'Untitled Note'}</div>
                            </div>
                          ))}
                          {relatedData.notes.length > 10 && (
                            <div className="text-xs text-gray-500 italic">
                              + {relatedData.notes.length - 10} more notes
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    {relatedData?.tasks && relatedData.tasks.length > 0 && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <ListTodo className="w-4 h-4 text-indigo-600" />
                          <h4 className="font-semibold text-gray-900">
                            Tasks ({relatedData.tasks.length})
                          </h4>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {relatedData.tasks.slice(0, 10).map((task) => (
                            <div key={task.id} className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <div className="font-medium">{task.title || 'Task'}</div>
                            </div>
                          ))}
                          {relatedData.tasks.length > 10 && (
                            <div className="text-xs text-gray-500 italic">
                              + {relatedData.tasks.length - 10} more tasks
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {relatedData?.documents && relatedData.documents.length > 0 && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <File className="w-4 h-4 text-slate-600" />
                          <h4 className="font-semibold text-gray-900">
                            Documents ({relatedData.documents.length})
                          </h4>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {relatedData.documents.slice(0, 10).map((doc) => (
                            <div key={doc.id} className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <div className="font-medium">{doc.file_name || 'Document'}</div>
                            </div>
                          ))}
                          {relatedData.documents.length > 10 && (
                            <div className="text-xs text-gray-500 italic">
                              + {relatedData.documents.length - 10} more documents
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Invoices */}
                    {relatedData?.invoices && relatedData.invoices.length > 0 && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Receipt className="w-4 h-4 text-amber-600" />
                          <h4 className="font-semibold text-gray-900">
                            Invoices ({relatedData.invoices.length})
                          </h4>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {relatedData.invoices.slice(0, 10).map((inv) => (
                            <div key={inv.id} className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <div className="font-medium">Invoice #{inv.invoice_number || inv.id.substring(0,6)}</div>
                            </div>
                          ))}
                          {relatedData.invoices.length > 10 && (
                            <div className="text-xs text-gray-500 italic">
                              + {relatedData.invoices.length - 10} more invoices
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Appointments */}
                    {relatedData?.appointments && relatedData.appointments.length > 0 && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <h4 className="font-semibold text-gray-900">
                            Appointments ({relatedData.appointments.length})
                          </h4>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {relatedData.appointments.slice(0, 10).map((apt) => (
                            <div key={apt.id} className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <div className="font-medium">{apt.title || 'Appointment'}</div>
                              {apt.start_time && (
                                <div className="text-xs text-gray-500">
                                  {new Date(apt.start_time).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ))}
                          {relatedData.appointments.length > 10 && (
                            <div className="text-xs text-gray-500 italic">
                              + {relatedData.appointments.length - 10} more appointments
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Total items to be deleted:</strong> {totalItems} record{totalItems !== 1 ? 's' : ''} plus all their associated data
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || deleteMutation.isPending || !clientId}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Everything'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
