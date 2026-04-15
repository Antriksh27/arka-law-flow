import React, { useState, useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeleteAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
}

const DeleteAppointmentDialog: React.FC<DeleteAppointmentDialogProps> = ({
  open,
  onOpenChange,
  appointment
}) => {
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);
  const [confirmStep, setConfirmStep] = useState(1); // 1 = first confirmation, 2 = second confirmation
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
      toast({
        title: "Success",
        description: "Appointment deleted successfully.",
      });
      handleCloseInternal();
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleFirstConfirm = () => {
    setConfirmStep(2);
  };

  const handleFinalDelete = () => {
    if (appointment?.id) {
      deleteAppointmentMutation.mutate(appointment.id);
    }
  };

  if (!appointment) return null;

  const handleCloseInternal = () => {
    setConfirmStep(1);
    handleClose();
  };

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title={confirmStep === 1 ? "Delete Appointment" : "Final Confirmation"}
        onClose={handleCloseInternal}
        icon={confirmStep === 1 ? <Trash2 className="w-5 h-5 text-red-500" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
        showBorder
      />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {confirmStep === 1 ? (
            <>
              <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-sm text-red-800 font-bold">
                    Are you sure you want to delete this appointment?
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-border/50 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Appointment Details</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500">Client</span>
                    <span className="text-xs font-bold text-slate-900">{appointment.client_name || 'No client assigned'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500">Lawyer</span>
                    <span className="text-xs font-bold text-slate-900">{appointment.lawyer_name || 'No lawyer assigned'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500">Scheduled For</span>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">{appointment.appointment_date}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{appointment.appointment_time?.slice(0, 5) || 'Time not set'}</p>
                    </div>
                  </div>
                  {appointment.title && (
                    <div className="flex justify-between items-start pt-2 border-t border-slate-50">
                      <span className="text-xs text-slate-500">Subject</span>
                      <span className="text-xs font-bold text-slate-900">{appointment.title}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  <strong className="font-bold">Warning:</strong> This action cannot be undone. All record of this booking will be removed from your calendar.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-red-100 border border-red-200 rounded-2xl p-5 text-center">
                <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center mb-4 shadow-sm">
                  <AlertTriangle className="h-8 w-8 text-red-600 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-red-900 mb-2">Final Confirmation Required</h3>
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                  This is the last chance to go back. Once confirmed, this data will be scrubbed from the system forever.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm text-center">
                <p className="text-sm font-bold text-slate-800">Delete appointment permanently?</p>
                <p className="text-[11px] text-slate-500 mt-2 font-medium uppercase tracking-widest">Irreversible operation</p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3">
        {confirmStep === 1 ? (
          <>

            <Button
              variant="destructive"
              onClick={handleFirstConfirm}
              className="flex-1 rounded-full h-12 font-bold shadow-lg"
            >
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setConfirmStep(1)}
              className="flex-1 rounded-full h-12 font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinalDelete}
              disabled={deleteAppointmentMutation.isPending}
              className="flex-[1.5] rounded-full h-12 font-bold shadow-lg"
            >
              {deleteAppointmentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing
                </>
              ) : (
                'Final Confirmation'
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[85vh] rounded-3xl">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAppointmentDialog;
