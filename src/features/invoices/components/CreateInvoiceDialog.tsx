
import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/use-dialog';

interface CreateInvoiceDialogProps {
  invoiceId?: string; // For editing
}

export const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({ invoiceId }) => {
  const { closeDialog } = useDialog();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{invoiceId ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
        <DialogDescription>
          {invoiceId ? 'Update the details of this invoice.' : 'Fill in the details to create a new invoice.'}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <p>Invoice form will go here...</p>
        {/* Form fields for client, case, items, dates, etc. */}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
        <Button type="submit" className="bg-primary-blue hover:bg-primary-blue/90 text-white">
          {invoiceId ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </DialogFooter>
    </>
  );
};
