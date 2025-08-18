import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber?: string;
}

export const DeleteInvoiceDialog: React.FC<DeleteInvoiceDialogProps> = ({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber
}) => {
  const [confirmationStep, setConfirmationStep] = useState<'first' | 'second'>('first');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First delete invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (itemsError) {
        throw new Error(`Failed to delete invoice items: ${itemsError.message}`);
      }

      // Then delete the invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (invoiceError) {
        throw new Error(`Failed to delete invoice: ${invoiceError.message}`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Invoice ${invoiceNumber || invoiceId} has been deleted successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setConfirmationStep('first');
    onOpenChange(false);
  };

  const handleFirstConfirm = () => {
    setConfirmationStep('second');
  };

  const handleFinalDelete = () => {
    deleteMutation.mutate();
  };

  const renderFirstConfirmation = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Delete Invoice
        </DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete invoice <strong>{invoiceNumber || invoiceId}</strong>?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This action cannot be undone. All associated data will be permanently removed.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleFirstConfirm}>
          Yes, Delete
        </Button>
      </DialogFooter>
    </>
  );

  const renderSecondConfirmation = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Final Confirmation
        </DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">
            ⚠️ Last chance to cancel!
          </p>
          <p className="text-sm text-red-700 mt-1">
            You are about to permanently delete invoice <strong>{invoiceNumber || invoiceId}</strong>. 
            This action is irreversible and will remove all associated invoice items and data.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setConfirmationStep('first')}>
          Go Back
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleFinalDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {confirmationStep === 'first' ? renderFirstConfirmation() : renderSecondConfirmation()}
      </DialogContent>
    </Dialog>
  );
};