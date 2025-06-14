
import type { Database } from '@/integrations/supabase/types';

export type InvoiceStatus = Database['public']['Enums']['invoice_status_enum'];

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number; // This is a generated column
}

// For displaying in the table, joining with client and case
export interface InvoiceListData extends Omit<Database['public']['Tables']['invoices']['Row'], 'client_id' | 'case_id'> {
  client: { full_name: string | null } | null;
  case: { title: string | null } | null;
  client_id: string; // Keep client_id for linking if needed
  case_id: string | null; // Keep case_id for linking
}

// For creating/editing, includes items
export interface InvoiceFormData extends Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'invoice_number' | 'total_amount' | 'created_at' | 'updated_at' | 'created_by' | 'firm_id' | 'status'> {
  invoice_items: Omit<InvoiceItem, 'id' | 'amount'>[];
  status?: InvoiceStatus; // Optional for creation, default 'draft'
}

