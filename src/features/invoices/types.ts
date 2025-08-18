
import type { Database } from '@/integrations/supabase/types';

export type InvoiceStatus = Database['public']['Enums']['invoice_status_enum'];

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number; // This is a generated column
}

export interface FlatFeeItem {
  id?: string;
  user_id?: string;
  date?: string;
  fixed_fee_type?: string;
  city?: string;
  unit_rate: number;
  discount_amount: number;
  discount_percentage: number;
}

export interface ExpenseItem {
  id?: string;
  owner_id?: string;
  date?: string;
  expense_type?: string;
  amount: number;
}

export interface AdjustmentItem {
  id?: string;
  adjustment_type: 'addition' | 'deduction';
  adjustment_value: number;
  description?: string;
}

// For displaying in the table, joining with client and case
export interface InvoiceListData extends Omit<Database['public']['Tables']['invoices']['Row'], 'client_id' | 'case_id'> {
  client: { full_name: string | null } | null;
  case: { title: string | null } | null;
  client_id: string; // Keep client_id for linking if needed
  case_id: string | null; // Keep case_id for linking
}

// For creating/editing, includes all related data
export interface InvoiceFormData extends Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'invoice_number' | 'total_amount' | 'created_at' | 'updated_at' | 'created_by' | 'firm_id' | 'status'> {
  invoice_items: Omit<InvoiceItem, 'id' | 'amount'>[];
  flat_fees: Omit<FlatFeeItem, 'id'>[];
  expenses: Omit<ExpenseItem, 'id'>[];
  adjustments: Omit<AdjustmentItem, 'id'>[];
  status?: InvoiceStatus; // Optional for creation, default 'draft'
}

// Constants for dropdown options
export const STATE_CODES = [
  { value: '01', label: '01-JAMMU AND KASHMIR' },
  { value: '02', label: '02-HIMACHAL PRADESH' },
  { value: '03', label: '03-PUNJAB' },
  { value: '04', label: '04-CHANDIGARH' },
  { value: '05', label: '05-UTTARAKHAND' },
  { value: '06', label: '06-HARYANA' },
  { value: '07', label: '07-DELHI' },
  { value: '08', label: '08-RAJASTHAN' },
  { value: '09', label: '09-UTTAR PRADESH' },
  { value: '10', label: '10-BIHAR' },
  { value: '11', label: '11-SIKKIM' },
  { value: '12', label: '12-ARUNACHAL PRADESH' },
  { value: '13', label: '13-NAGALAND' },
  { value: '14', label: '14-MANIPUR' },
  { value: '15', label: '15-MIZORAM' },
  { value: '16', label: '16-TRIPURA' },
  { value: '17', label: '17-MEGHALAYA' },
  { value: '18', label: '18-ASSAM' },
  { value: '19', label: '19-WEST BENGAL' },
  { value: '20', label: '20-JHARKHAND' },
  { value: '21', label: '21-ODISHA' },
  { value: '22', label: '22-CHHATTISGARH' },
  { value: '23', label: '23-MADHYA PRADESH' },
  { value: '24', label: '24-GUJARAT' },
  { value: '25', label: '25-DAMAN AND DIU' },
  { value: '26', label: '26-DADRA AND NAGAR HAVELI' },
  { value: '27', label: '27-MAHARASHTRA' },
  { value: '28', label: '28-ANDHRA PRADESH' },
  { value: '29', label: '29-KARNATAKA' },
  { value: '30', label: '30-GOA' },
  { value: '31', label: '31-LAKSHADWEEP' },
  { value: '32', label: '32-KERALA' },
  { value: '33', label: '33-TAMIL NADU' },
  { value: '34', label: '34-PUDUCHERRY' },
  { value: '35', label: '35-ANDAMAN AND NICOBAR ISLANDS' },
  { value: '36', label: '36-TELANGANA' },
  { value: '37', label: '37-ANDHRA PRADESH (NEW)' }
];

export const FIXED_FEE_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'court_appearance', label: 'Court Appearance' },
  { value: 'document_review', label: 'Document Review' },
  { value: 'legal_research', label: 'Legal Research' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'other', label: 'Other' }
];

export const EXPENSE_TYPES = [
  { value: 'court_fees', label: 'Court Fees' },
  { value: 'travel', label: 'Travel' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'expert_witness', label: 'Expert Witness' },
  { value: 'photocopying', label: 'Photocopying' },
  { value: 'postage', label: 'Postage' },
  { value: 'other', label: 'Other' }
];

