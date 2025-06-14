
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateInvoiceDialog } from './CreateInvoiceDialog'; // We'll create this next

export const InvoicesHeader: React.FC = () => {
  const { openDialog } = useDialog();

  const handleNewInvoice = () => {
    openDialog(<CreateInvoiceDialog />);
  };

  return (
    <div className="flex w-full items-center justify-between mb-6">
      <div className="flex flex-col items-start gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <p className="text-base text-gray-600">Manage all your firm's invoices.</p>
      </div>
      <Button
        onClick={handleNewInvoice}
        className="bg-primary-blue hover:bg-primary-blue/90 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Invoice
      </Button>
    </div>
  );
};
