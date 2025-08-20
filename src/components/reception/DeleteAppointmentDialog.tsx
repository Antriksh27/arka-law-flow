import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      handleClose();
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

  const handleClose = () => {
    setConfirmStep(1);
    onOpenChange(false);
  };

  const handleFirstConfirm = () => {
    setConfirmStep(2);
  };

  const handleFinalDelete = () => {
    if (appointment?.id) {
      deleteAppointmentMutation.mutate(appointment.id);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {confirmStep === 1 ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">
                  Are you sure you want to delete this appointment?
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Appointment Details:</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Client:</strong> {appointment.client_name || 'No client assigned'}</p>
                  <p><strong>Lawyer:</strong> {appointment.lawyer_name || 'No lawyer assigned'}</p>
                  <p><strong>Date:</strong> {appointment.appointment_date}</p>
                  <p><strong>Time:</strong> {appointment.appointment_time?.slice(0, 5) || 'Time not set'}</p>
                  {appointment.title && <p><strong>Title:</strong> {appointment.title}</p>}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This action cannot be undone. The appointment will be permanently deleted.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <p className="text-sm text-red-900 font-medium">
                  Final Confirmation Required
                </p>
                <p className="text-sm text-red-800 mt-1">
                  This is your last chance to cancel. Click "Delete Permanently" to confirm deletion.
                </p>
              </div>

              <div className="flex items-center justify-center p-6">
                <Trash2 className="h-12 w-12 text-red-500" />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  Delete appointment permanently?
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This action is irreversible
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-gray-100">
          {confirmStep === 1 ? (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleFirstConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Delete
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setConfirmStep(1)}
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleFinalDelete}
                disabled={deleteAppointmentMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteAppointmentMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAppointmentDialog;