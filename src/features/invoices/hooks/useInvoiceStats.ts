import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InvoiceStats {
  outstanding: number;
  overdue: number;
  paidThisMonth: number;
  draftCount: number;
}

export const useInvoiceStats = (firmId: string | undefined) => {
  return useQuery({
    queryKey: ['invoice-stats', firmId],
    queryFn: async (): Promise<InvoiceStats> => {
      if (!firmId) throw new Error('Firm ID required');

      // Get current date info
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch all invoices for the firm
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('status, total_amount, due_date, created_at')
        .eq('firm_id', firmId);

      if (error) throw error;

      const stats: InvoiceStats = {
        outstanding: 0,
        overdue: 0,
        paidThisMonth: 0,
        draftCount: 0,
      };

      invoices.forEach(invoice => {
        const amount = Number(invoice.total_amount) || 0;
        const dueDate = new Date(invoice.due_date);
        const createdDate = new Date(invoice.created_at);

        switch (invoice.status) {
          case 'sent':
            stats.outstanding += amount;
            // Check if overdue
            if (dueDate < now) {
              stats.overdue += amount;
            }
            break;
          case 'overdue':
            stats.overdue += amount;
            break;
          case 'paid':
            // Check if paid this month
            if (createdDate >= firstDayOfMonth && createdDate <= lastDayOfMonth) {
              stats.paidThisMonth += amount;
            }
            break;
          case 'draft':
            stats.draftCount += 1;
            break;
        }
      });

      return stats;
    },
    enabled: !!firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};