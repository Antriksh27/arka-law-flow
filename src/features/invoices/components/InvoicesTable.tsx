
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InvoiceListData } from '../types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { format } from 'date-fns';

interface InvoicesTableProps {
  invoices: InvoiceListData[];
  isLoading: boolean;
  onEdit?: (invoiceId: string) => void;
  onView?: (invoiceId: string) => void;
  onDelete?: (invoiceId: string) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({ 
  invoices, 
  isLoading, 
  onEdit, 
  onView, 
  onDelete 
}) => {
  if (isLoading) {
    return <p>Loading invoices...</p>; // Replace with Skeleton loader later
  }

  if (invoices.length === 0) {
    return <p className="text-center text-gray-500 py-8">No invoices found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Case</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
            <TableCell>{invoice.client?.full_name || 'N/A'}</TableCell>
            <TableCell>{invoice.case?.title || 'N/A'}</TableCell>
            <TableCell>{invoice.issue_date ? format(new Date(invoice.issue_date), 'MMM d, yyyy') : 'N/A'}</TableCell>
            <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'N/A'}</TableCell>
            <TableCell className="text-right">₹{invoice.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</TableCell>
            <TableCell>
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(invoice.id)}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(invoice.id)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete?.(invoice.id)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
