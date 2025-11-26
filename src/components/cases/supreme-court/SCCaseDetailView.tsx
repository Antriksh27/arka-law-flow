import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SCDiaryBenchCard } from './SCDiaryBenchCard';
import { SCEarlierCourtsTable } from './SCEarlierCourtsTable';
import { SCTaggedMattersTable } from './SCTaggedMattersTable';
import { SCListingHistoryTimeline } from './SCListingHistoryTimeline';
import { SCNoticesTable } from './SCNoticesTable';
import { SCDefectsTable } from './SCDefectsTable';
import { SCJudgementOrdersTable } from './SCJudgementOrdersTable';
import { SCOfficeReportsTable } from './SCOfficeReportsTable';
import { SCSimilaritiesAccordion } from './SCSimilaritiesAccordion';

interface SCCaseDetailViewProps {
  caseId: string;
  caseNumber?: string | string[] | null;
}

export function SCCaseDetailView({ caseId, caseNumber: propCaseNumber }: SCCaseDetailViewProps) {
  // Fetch Supreme Court case data from database tables AND fetched_data
  const { data: scData, isLoading } = useQuery({
    queryKey: ['supreme-court-case', caseId],
    queryFn: async () => {
      const [
        earlierCourts,
        taggedMatters,
        listingDates,
        notices,
        defects,
        orders,
        reports,
        similarities,
        legalkartCase,
        caseRecord,
      ] = await Promise.all([
        supabase.from('sc_earlier_court_details').select('*').eq('case_id', caseId),
        supabase.from('sc_tagged_matters').select('*').eq('case_id', caseId),
        supabase.from('sc_listing_dates').select('*').eq('case_id', caseId).order('cl_date', { ascending: false }),
        supabase.from('sc_notices').select('*').eq('case_id', caseId),
        supabase.from('sc_defects').select('*').eq('case_id', caseId),
        supabase.from('sc_judgement_orders').select('*').eq('case_id', caseId).order('order_date', { ascending: false }),
        supabase.from('sc_office_reports').select('*').eq('case_id', caseId),
        supabase.from('sc_similarities').select('*').eq('case_id', caseId),
        supabase.from('legalkart_cases').select('*').eq('case_id', caseId).maybeSingle(),
        supabase.from('cases').select('fetched_data').eq('id', caseId).maybeSingle(),
      ]);
      
      // Parse from fetched_data if database tables are empty
      const fetchedData = caseRecord.data?.fetched_data as any;
      const rd = fetchedData?.data ?? fetchedData ?? {};
      const caseDetails = rd.case_details || {};
      
      // Helper to parse dates
      const parseDate = (dateStr: any): string | null => {
        if (!dateStr) return null;
        try {
          const s = String(dateStr).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
          const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
          if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
          const d = new Date(s);
          return !isNaN(d.getTime()) ? d.toISOString().slice(0,10) : null;
        } catch {
          return null;
        }
      };

      // Parse SC data from fetched_data if tables are empty (cast to any to avoid type issues)
      let parsedEarlierCourts: any[] = earlierCourts.data || [];
      if (parsedEarlierCourts.length === 0 && caseDetails['Earlier Court Details']) {
        const ec = caseDetails['Earlier Court Details'] || [];
        parsedEarlierCourts = Array.isArray(ec) ? ec.map((item: any, index: number) => ({
          id: `ec-${index}`,
          serial_no: item['S.No.'],
          court: item.Court,
          agency_state: item['Agency State'],
          agency_code: item['Agency Code'],
          case_no: item['Case No.'],
          order_date: parseDate(item['Order Date']),
          cnr_no: item['CNR No. / Designation'],
          judge1: item['Judge1 / Judge2 / Judge3'],
          judgment_challenged: item['Judgment Challenged'] === 'Yes',
          judgment_type: item['Judgment Type'],
        })) : [];
      }
      
      let parsedTaggedMatters: any[] = taggedMatters.data || [];
      if (parsedTaggedMatters.length === 0 && caseDetails['Tagged Matters']) {
        const tm = caseDetails['Tagged Matters'] || [];
        parsedTaggedMatters = Array.isArray(tm) ? tm.map((item: any, index: number) => ({
          id: `tm-${index}`,
          matter_type: item.Type,
          tagged_case_number: item['Case Number'],
          petitioner_vs_respondent: item['Petitioner vs. Respondent'],
          list_status: item.List,
          matter_status: item.Status,
          ia_info: item.IA,
          entry_date: parseDate(item['Entry Date']),
        })) : [];
      }
      
      let parsedListingDates: any[] = listingDates.data || [];
      if (parsedListingDates.length === 0 && caseDetails['Listing Dates']) {
        const ld = caseDetails['Listing Dates'] || [];
        parsedListingDates = Array.isArray(ld) ? ld.map((item: any, index: number) => ({
          id: `ld-${index}`,
          cl_date: parseDate(item['CL Date']),
          misc_or_regular: item['Misc./Regular'],
          stage: item.Stage,
          purpose: item.Purpose,
          judges: item.Judges ? [item.Judges] : null,
          remarks: item.Remarks,
          listed_status: item.Listed,
        })) : [];
      }
      
      let parsedNotices: any[] = notices.data || [];
      if (parsedNotices.length === 0 && caseDetails['Notices']) {
        const n = caseDetails['Notices'] || [];
        parsedNotices = Array.isArray(n) ? n.map((item: any, index: number) => {
          const stateDistrict = item['State / District'] || '';
          const [state, district] = stateDistrict.split('/').map((s: string) => s.trim());
          return {
            id: `n-${index}`,
            sr_no: item['Serial Number'],
            process_id: item['Process Id'],
            notice_type: item['Notice Type'],
            name: item.Name,
            state: state || null,
            district: district || null,
            issue_date: parseDate(item['Issue Date']),
            returnable_date: parseDate(item['Returnable Date']),
          };
        }) : [];
      }
      
      let parsedDefects: any[] = defects.data || [];
      if (parsedDefects.length === 0 && caseDetails['Defects']) {
        const d = caseDetails['Defects'] || [];
        parsedDefects = Array.isArray(d) ? d.map((item: any, index: number) => ({
          id: `d-${index}`,
          sr_no: item['S.No.'],
          default_type: item.Default,
          remarks: item.Remarks,
          notification_date: parseDate(item['Notification Date']),
          removed_on_date: parseDate(item['Removed On Date']),
        })) : [];
      }
      
      let parsedOrders: any[] = orders.data || [];
      if (parsedOrders.length === 0 && caseDetails['Judgement Orders']) {
        const o = caseDetails['Judgement Orders'] || [];
        parsedOrders = Array.isArray(o) ? o.map((item: any, index: number) => ({
          id: `o-${index}`,
          order_date: parseDate(item.date),
          pdf_url: item.url,
          order_type: item.type,
        })) : [];
      }
      
      let parsedReports: any[] = reports.data || [];
      if (parsedReports.length === 0 && caseDetails['Office Report']) {
        const r = caseDetails['Office Report'] || [];
        parsedReports = Array.isArray(r) ? r.map((item: any, index: number) => ({
          id: `r-${index}`,
          sr_no: item['Serial Number'],
          process_id: item['Process Id'],
          order_date: parseDate(item['Order Date']?.text || item['Order Date']),
          html_url: item['Order Date']?.pdf_url || null,
          receiving_date: parseDate(item['Receiving Date']),
        })) : [];
      }
      
      let parsedSimilarities: any[] = similarities.data || [];
      if (parsedSimilarities.length === 0 && caseDetails['Similarities']) {
        const s = caseDetails['Similarities'] || [];
        parsedSimilarities = Array.isArray(s) ? s.map((item: any, index: number) => ({
          id: `s-${index}`,
          category: item.category,
          similarity_data: item.data,
        })) : [];
      }
      
      // Extract case number - handle array type
      const caseNumberValue = legalkartCase.data?.case_number || caseDetails['Case Number'];
      const parsedCaseNumber = Array.isArray(caseNumberValue) 
        ? caseNumberValue[0] 
        : typeof caseNumberValue === 'string' 
        ? caseNumberValue 
        : null;
        
      // Helper to extract diary number
      const extractDiaryNumber = (diaryInfo: string | null): string | null => {
        if (!diaryInfo) return null;
        const match = diaryInfo.match(/Diary No\.\s*-?\s*(\d+\/\d+)/i);
        return match ? match[1] : diaryInfo.split('\n')[0]?.trim() || null;
      };
      
      // Helper to extract bench composition
      const extractBenchComposition = (presListedOn: string | null): string[] | null => {
        if (!presListedOn) return null;
        const match = presListedOn.match(/\[(.*?)\]/);
        if (match) {
          return match[1].split(/,\s*and\s*|,\s*/).map((j: string) => j.trim()).filter(Boolean);
        }
        return null;
      };

      return {
        earlierCourts: parsedEarlierCourts,
        taggedMatters: parsedTaggedMatters,
        listingDates: parsedListingDates,
        notices: parsedNotices,
        defects: parsedDefects,
        orders: parsedOrders,
        reports: parsedReports,
        similarities: parsedSimilarities,
        legalkartCase: legalkartCase.data || {
          diary_number: rd.diary_number || caseDetails['Diary Number'] || extractDiaryNumber(caseDetails['Diary Info']),
          case_title: caseDetails['Case Title'] || (rd.petitioner && rd.respondent ? `${rd.petitioner} vs ${rd.respondent}` : null),
          case_number: caseDetails['Case Number'],
          bench_composition: extractBenchComposition(caseDetails['Present/Last Listed On']),
        },
        caseNumber: (parsedCaseNumber || propCaseNumber) as string | string[] | null,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diary Number & Bench Composition */}
      <SCDiaryBenchCard 
        diaryNumber={scData?.legalkartCase?.diary_number}
        benchComposition={
          Array.isArray(scData?.legalkartCase?.bench_composition) 
            ? scData.legalkartCase.bench_composition.join(', ')
            : scData?.legalkartCase?.bench_composition
        }
        caseTitle={scData?.legalkartCase?.case_title}
        caseNumber={scData?.caseNumber ?? null}
      />

      {/* Tabbed Content */}
      <Card className="p-6">
        <Tabs defaultValue="earlier-courts" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="earlier-courts">Earlier Courts</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="hearings">Hearings</TabsTrigger>
            <TabsTrigger value="notices">Notices</TabsTrigger>
            <TabsTrigger value="defects">Defects</TabsTrigger>
            <TabsTrigger value="tagged">Tagged Matters</TabsTrigger>
            <TabsTrigger value="reports">Office Reports</TabsTrigger>
            <TabsTrigger value="similarities">Similarities</TabsTrigger>
          </TabsList>

          <TabsContent value="earlier-courts" className="mt-6">
            <SCEarlierCourtsTable data={scData?.earlierCourts || []} />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <SCJudgementOrdersTable data={scData?.orders || []} />
          </TabsContent>

          <TabsContent value="hearings" className="mt-6">
            <SCListingHistoryTimeline data={scData?.listingDates || []} />
          </TabsContent>

          <TabsContent value="notices" className="mt-6">
            <SCNoticesTable data={scData?.notices || []} />
          </TabsContent>

          <TabsContent value="defects" className="mt-6">
            <SCDefectsTable data={scData?.defects || []} />
          </TabsContent>

          <TabsContent value="tagged" className="mt-6">
            <SCTaggedMattersTable data={scData?.taggedMatters || []} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <SCOfficeReportsTable data={scData?.reports || []} />
          </TabsContent>

          <TabsContent value="similarities" className="mt-6">
            <SCSimilaritiesAccordion data={scData?.similarities || []} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}