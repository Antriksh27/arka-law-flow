import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DetailsTabProps {
  caseData: any;
  legalkartData?: any;
  caseId: string;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ 
  caseData, 
  legalkartData,
  caseId 
}) => {
  const queryClient = useQueryClient();

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd-MM-yyyy');
    } catch {
      return '-';
    }
  };

  const parseName = (text: string) => {
    if (!text) return '';
    return text.replace(/^\d+\)\s*/, '').split('Advocate')[0].trim();
  };

  const parseAdvocates = (text: string) => {
    if (!text) return [];
    const match = text.match(/Advocate[-:]?\s*(.+)/i);
    if (!match) return [];
    return match[1].split(',').map(adv => adv.trim().replace(/\(.*?\)/g, '').trim());
  };

  // Fetch orders
  const { data: legalkartOrders } = useQuery({
    queryKey: ['legalkart-orders', caseId],
    queryFn: async () => {
      const { data } = await supabase
        .from('legalkart_orders' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('order_date', { ascending: false });
      return data || [];
    }
  });

  const refreshData = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'searchCase',
          cnr: caseData.cnr_number,
          searchType: 'high_court'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-detail', caseId] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-orders', caseId] });
      toast.success('Case data refreshed successfully');
    },
    onError: () => {
      toast.error('Failed to refresh case data');
    }
  });

  return (
    <div className="space-y-8">
      {/* Case Information */}
      <div>
        <h3 className="text-lg font-bold text-[#1F2937] mb-4">Case Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div className="space-y-1">
            <p className="text-[#6B7280]">Case Number</p>
            <p className="font-medium text-[#1F2937]">{caseData.case_number || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Court Name</p>
            <p className="font-medium text-[#1F2937]">{caseData.court || caseData.court_name || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Case Type</p>
            <p className="font-medium text-[#1F2937]">{caseData.case_type || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Filing Date</p>
            <p className="font-medium text-[#1F2937]">{formatDate(caseData.filing_date)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Registration Date</p>
            <p className="font-medium text-[#1F2937]">{formatDate(caseData.registration_date)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Status</p>
            <p className="font-medium text-[#1F2937]">{caseData.status || 'Open'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">CNR Number</p>
            <p className="font-medium text-[#1F2937]">{legalkartData?.cnr || caseData.cnr_number || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Judge Name</p>
            <p className="font-medium text-[#1F2937]">{legalkartData?.coram || caseData.coram || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Stage</p>
            <p className="font-medium text-[#1F2937]">{caseData.stage || '-'}</p>
          </div>
          {caseData.filing_number && (
            <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-3">
              <p className="text-[#6B7280]">Filing Number & Year</p>
              <p className="font-medium text-[#1F2937]">{caseData.filing_number}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[#6B7280]">District</p>
            <p className="font-medium text-[#1F2937]">{caseData.district || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">State</p>
            <p className="font-medium text-[#1F2937]">{caseData.state || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Priority</p>
            <p className="font-medium text-[#1F2937]">{caseData.priority || 'Medium'}</p>
          </div>
        </div>
      </div>

      {/* Acts & Sections */}
      {(caseData.acts?.length > 0 || caseData.sections?.length > 0 || caseData.under_act || caseData.under_section) && (
        <div>
          <h3 className="text-lg font-bold text-[#1F2937] mb-4">Acts & Sections</h3>
          <div className="flex flex-wrap gap-2">
            {caseData.acts?.map((act: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-[#1173d4]/10 text-[#1173d4] text-sm font-medium rounded-full">
                {act}
              </span>
            ))}
            {caseData.sections?.map((section: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-[#1173d4]/10 text-[#1173d4] text-sm font-medium rounded-full">
                {section}
              </span>
            ))}
            {caseData.under_act && (
              <span className="px-3 py-1 bg-[#1173d4]/10 text-[#1173d4] text-sm font-medium rounded-full">
                {caseData.under_act}
              </span>
            )}
            {caseData.under_section && (
              <span className="px-3 py-1 bg-[#1173d4]/10 text-[#1173d4] text-sm font-medium rounded-full">
                Section: {caseData.under_section}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Parties Information */}
      {(caseData.petitioner || caseData.respondent || legalkartData?.petitioner || legalkartData?.respondent) && (
        <div>
          <h3 className="text-lg font-bold text-[#1F2937] mb-4">Parties Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Petitioners */}
            <div className="bg-[#F9FAFB] p-4 rounded-lg">
              <p className="font-semibold text-[#1F2937] mb-2">Petitioners</p>
              <p className="text-sm text-[#6B7280]">
                {parseName(legalkartData?.petitioner || caseData.petitioner || '-')}
              </p>
              {(legalkartData?.petitioner_advocate || caseData.petitioner_advocate) && (
                <div className="mt-2 pt-2 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280]">Advocate</p>
                  {parseAdvocates(legalkartData?.petitioner_advocate || caseData.petitioner_advocate || '').map((adv, idx) => (
                    <p key={idx} className="font-medium text-sm text-[#1F2937]">{adv}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Respondents */}
            <div className="bg-[#F9FAFB] p-4 rounded-lg">
              <p className="font-semibold text-[#1F2937] mb-2">Respondents</p>
              <p className="text-sm text-[#6B7280]">
                {parseName(legalkartData?.respondent || caseData.respondent || '-')}
              </p>
              {(legalkartData?.respondent_advocate || caseData.respondent_advocate) && (
                <div className="mt-2 pt-2 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280]">Advocate</p>
                  {parseAdvocates(legalkartData?.respondent_advocate || caseData.respondent_advocate || '').map((adv, idx) => (
                    <p key={idx} className="font-medium text-sm text-[#1F2937]">{adv}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Case Details */}
      {legalkartData && (
        <div>
          <h3 className="text-lg font-bold text-[#1F2937] mb-4">Additional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            {legalkartData.purpose_of_hearing && (
              <div className="space-y-1">
                <p className="text-[#6B7280]">Purpose of Listing</p>
                <p className="font-medium text-[#1F2937]">{legalkartData.purpose_of_hearing}</p>
              </div>
            )}
            {legalkartData.case_sub_type && (
              <div className="space-y-1">
                <p className="text-[#6B7280]">Case Sub Type</p>
                <p className="font-medium text-[#1F2937]">{legalkartData.case_sub_type}</p>
              </div>
            )}
            {legalkartData.case_classification && (
              <div className="space-y-1">
                <p className="text-[#6B7280]">Case Classification</p>
                <p className="font-medium text-[#1F2937]">{legalkartData.case_classification}</p>
              </div>
            )}
            {legalkartData.bench_type && (
              <div className="space-y-1">
                <p className="text-[#6B7280]">Bench Type</p>
                <p className="font-medium text-[#1F2937]">{legalkartData.bench_type}</p>
              </div>
            )}
            {legalkartData.court_complex && (
              <div className="space-y-1">
                <p className="text-[#6B7280]">Court Complex</p>
                <p className="font-medium text-[#1F2937]">{legalkartData.court_complex}</p>
              </div>
            )}
            {caseData.fir_number && (
              <div className="space-y-1">
                <p className="text-[#6B7280]">FIR Number</p>
                <p className="font-medium text-[#1F2937]">{caseData.fir_number}</p>
              </div>
            )}
            {caseData.police_station && (
              <div className="space-y-1">
                <p className="text-[#6B7280]">Police Station</p>
                <p className="font-medium text-[#1F2937]">{caseData.police_station}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hearing History */}
      {legalkartOrders && legalkartOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1F2937]">Hearing History</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refreshData.mutate()}
              disabled={refreshData.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshData.isPending ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
          <div className="space-y-3">
            {legalkartOrders.slice(0, 5).map((order: any, index: number) => (
              <div key={index} className="border-l-2 border-[#1173d4] pl-4 py-2 bg-[#F9FAFB] rounded-r">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-semibold text-[#1F2937]">
                    {order.order_date ? formatDate(order.order_date) : 'Date not available'}
                  </span>
                  <span className="text-xs text-[#6B7280]">Order #{index + 1}</span>
                </div>
                {order.order_text && (
                  <p className="text-sm text-[#6B7280] mt-1">{order.order_text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
