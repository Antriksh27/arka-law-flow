
import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '../types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
  const statusColors: Record<InvoiceStatus, string> = {
    draft: 'bg-gray-200 text-gray-700 hover:bg-gray-200',
    sent: 'bg-accent-blue text-primary-blue hover:bg-accent-blue',
    paid: 'bg-green-100 text-green-700 hover:bg-green-100',
    overdue: 'bg-red-100 text-red-700 hover:bg-red-100',
    cancelled: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  };

  return (
    <Badge className={`capitalize ${statusColors[status] || 'bg-gray-200 text-gray-700'}`}>
      {status.replace('_', ' ')}
    </Badge>
  );
};
