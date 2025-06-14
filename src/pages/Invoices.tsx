
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvoicesHeader } from '@/features/invoices/components/InvoicesHeader';
import { InvoicesTable } from '@/features/invoices/components/InvoicesTable';
import type { InvoiceListData } from '@/features/invoices/types';
import { Loader2, AlertCircle } from 'lucide-react';

const fetchInvoices = async (firmId: string | undefined): Promise<InvoiceListData[]> => {
  if (!firmId) {
    throw new Error('Firm ID is required to fetch invoices.');
  }

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(full_name),
      case:cases(title)
    `)
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    throw new Error(error.message);
  }
  // Explicitly cast to InvoiceListData[]
  return data as InvoiceListData[];
};

const Invoices: React.FC = () => {
-  const { firmId } = useAuth();
+  const { firmId, loading, firmError } = useAuth();

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices', firmId],
    queryFn: () => fetchInvoices(firmId),
    enabled: !!firmId,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <InvoicesHeader />
      
      {(isLoading || loading) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
          <span className="ml-2 text-gray-600">Loading invoices...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Failed to load invoices: {error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && invoices && (
        <div className="bg-white shadow-sm rounded-2xl p-0">
          <InvoicesTable invoices={invoices} isLoading={isLoading} />
        </div>
      )}
-       {!isLoading && !error && !invoices && firmId && (
-         <div className="text-center py-12">
-            <p className="text-gray-500">No invoices found for this firm.</p>
-          </div>
-       )}
-        {!firmId && !isLoading && (
-           <div className="text-center py-12">
-            <p className="text-gray-500">Firm information not available. Cannot load invoices.</p>
-          </div>
-        )}
+      {!isLoading && !loading && !error && !invoices && firmId && (
+         <div className="text-center py-12">
+           <p className="text-gray-500">No invoices found for this firm.</p>
+         </div>
+      )}
+      {!isLoading && !loading && !firmId && (
+         <div className="text-center py-12">
+           <p className="text-gray-500">Firm information not available. Cannot load invoices.</p>
+           {firmError && (
+              <p className="mt-2 text-red-400 text-sm">{firmError}</p>
+           )}
+         </div>
+      )}
    </div>
  );
};

export default Invoices;

