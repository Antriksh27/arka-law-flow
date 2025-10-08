import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

  // Parse petitioner/respondent strings
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

  // Parse petitioners and respondents
  const petitioners = legalkartData?.petitioner_and_advocate
    ? [{ name: parseName(legalkartData.petitioner_and_advocate) }]
    : caseData?.petitioner ? [{ name: caseData.petitioner }] : [];

  const respondents = legalkartData?.respondent_and_advocate
    ? [{ name: parseName(legalkartData.respondent_and_advocate) }]
    : caseData?.respondent ? [{ name: caseData.respondent }] : [];

  const petitionerAdvocates = legalkartData?.petitioner_and_advocate
    ? parseAdvocates(legalkartData.petitioner_and_advocate)
    : [];

  const respondentAdvocates = legalkartData?.respondent_and_advocate
    ? parseAdvocates(legalkartData.respondent_and_advocate)
    : [];

  // Fetch orders
  const { data: orders } = useQuery({
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
      // Call Legalkart API to refresh case data
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
      toast.success('Case data refreshed successfully');
    },
    onError: () => {
      toast.error('Failed to refresh case data');
    }
  });

  const DataRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div className="flex py-3 border-b border-border last:border-0">
      <div className="w-56 text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex-1 text-sm text-foreground">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basic Case Information - Two Columns */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-1">
          <DataRow label="Case Reference Number" value={caseData.case_number || caseData.registration_number || '-'} />
          <DataRow label="Court" value={caseData.court_name || caseData.court || '-'} />
          <DataRow label="Matter Reference Number" value={caseData.filing_number || '-'} />
          <DataRow label="Title" value={caseData.vs || caseData.title || '-'} />
          <DataRow label="Litigant Type" value={caseData.case_type || '-'} />
        </div>

        <div className="space-y-1">
          <DataRow label="Client" value={caseData.clients?.full_name || '-'} />
          <DataRow label="Created By" value={caseData.profiles?.full_name || '-'} />
          <DataRow label="Practice Area" value={caseData.case_type || '-'} />
          <DataRow label="Billing Method" value="Flat Fee" />
          <DataRow 
            label="Status" 
            value={
              <Badge variant="outline">
                {caseData.status === 'open' ? 'Open' : caseData.status || 'Unknown'}
              </Badge>
            }
          />
          <DataRow label="Open Date" value={formatDate(caseData.filing_date)} />
        </div>
      </div>

      {/* Court CaseTracker Section */}
      {legalkartData && (
        <div className="bg-muted/30 border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Court CaseTracker</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refreshData.mutate()}
              disabled={refreshData.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshData.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <DataRow label="Case Title" value={legalkartData.case_title || caseData.vs || '-'} />
              <DataRow label="CNR" value={legalkartData.cnr_num || caseData.cnr_number || '-'} />
              <DataRow label="Filing Date" value={formatDate(legalkartData.filing_date || caseData.filing_date)} />
            </div>

            <div className="space-y-1">
              <DataRow 
                label="Case Status" 
                value={
                  <div className="flex items-center gap-2">
                    <span>{legalkartData.case_status || caseData.status || 'Pending'}</span>
                    <Badge variant="success" className="bg-green-100 text-green-700">
                      ✓
                    </Badge>
                  </div>
                }
              />
              <DataRow 
                label="Next Hearing Date" 
                value={
                  <span className="text-red-600 font-medium">
                    {formatDate(legalkartData.next_hearing_date || caseData.next_hearing_date)}
                  </span>
                } 
              />
              <DataRow label="Last hearing date" value={formatDate(legalkartData.last_hearing_date)} />
              <DataRow 
                label="Last Order" 
                value={
                  orders && orders[0] ? (
                    <a href="#" className="text-primary hover:underline">
                      Order on {formatDate((orders[0] as any).order_date)}
                    </a>
                  ) : '-'
                } 
              />
            </div>
          </div>
        </div>
      )}

      {/* Case Details and Advocates - Two Columns */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-base font-semibold mb-3">Case Details</h3>
          <div className="space-y-1">
            <DataRow label="Purpose of Listing" value={legalkartData?.purpose_of_hearing || '-'} />
            <DataRow label="Registration Date" value={formatDate(legalkartData?.registration_date || caseData.registration_date)} />
            <DataRow label="Case Desc" value={legalkartData?.case_type || caseData.description || '-'} />
            <DataRow label="Bench Category" value={legalkartData?.bench_type || '-'} />
            <DataRow label="Stamp Number" value={legalkartData?.filing_number || '-'} />
            <DataRow label="Listing Date" value={formatDate(legalkartData?.listed_date)} />
            <DataRow label="Presented On" value={formatDate(legalkartData?.registration_date)} />
            <DataRow label="District" value={legalkartData?.district || caseData.district || '-'} />
            <DataRow label="Case Type" value={legalkartData?.case_type || caseData.case_type || '-'} />
            <DataRow label="Case Status" value={legalkartData?.case_status || caseData.status || '-'} />
            <DataRow label="Judges" value={legalkartData?.coram || caseData.coram || '-'} />
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">Advocates</h3>
          <div className="space-y-4">
            {petitionerAdvocates.length > 0 && petitionerAdvocates.map((adv, idx) => (
              <DataRow 
                key={idx}
                label="Appellant(s) Advocate" 
                value={`${adv} for Petitioner(s) -> 1`} 
              />
            ))}
            
            {respondentAdvocates.length > 0 && respondentAdvocates.map((adv, idx) => (
              <DataRow 
                key={idx}
                label="Respondent(s) Advocate" 
                value={`${adv} for Respondent(s) -> ${idx + 1}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Parties - Petitioners and Respondents */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-base font-semibold mb-3">Petitioners</h3>
          <div className="space-y-2">
            {petitioners.map((p, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <span className="font-medium">{idx + 1}</span>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">Respondent</h3>
          <div className="space-y-2">
            {respondents.map((r, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <span className="font-medium">{idx + 1}</span>
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="judgments">
          <AccordionTrigger className="text-base font-semibold">
            Judgments / Orders
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {orders && orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">{formatDate((order as any).order_date)}</span>
                      <a href="#" className="text-primary hover:underline text-sm">
                        Download [Order]
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No orders available</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="listing">
          <AccordionTrigger className="text-base font-semibold">
            Listing Dates
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">No listing dates available</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="office">
          <AccordionTrigger className="text-base font-semibold">
            Office Details
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">No office details available</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="lower-court">
          <AccordionTrigger className="text-base font-semibold">
            Lower Court Details
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">No lower court details available</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Recent Activity */}
      <div>
        <h3 className="text-base font-semibold mb-3">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    </div>
  );
};
