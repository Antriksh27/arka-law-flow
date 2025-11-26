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
  // Fetch Supreme Court case data
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
      ] = await Promise.all([
        supabase.from('sc_earlier_court_details').select('*').eq('case_id', caseId),
        supabase.from('sc_tagged_matters').select('*').eq('case_id', caseId),
        supabase.from('sc_listing_dates').select('*').eq('case_id', caseId).order('cl_date', { ascending: false }),
        supabase.from('sc_notices').select('*').eq('case_id', caseId),
        supabase.from('sc_defects').select('*').eq('case_id', caseId),
        supabase.from('sc_judgement_orders').select('*').eq('case_id', caseId).order('order_date', { ascending: false }),
        supabase.from('sc_office_reports').select('*').eq('case_id', caseId),
        supabase.from('sc_similarities').select('*').eq('case_id', caseId),
        supabase.from('legalkart_cases').select('*').eq('case_id', caseId).single(),
      ]);
      
      // Extract case number - handle array type
      const caseNumberValue = legalkartCase.data?.case_number;
      const parsedCaseNumber = Array.isArray(caseNumberValue) 
        ? caseNumberValue[0] 
        : typeof caseNumberValue === 'string' 
        ? caseNumberValue 
        : null;

      return {
        earlierCourts: earlierCourts.data || [],
        taggedMatters: taggedMatters.data || [],
        listingDates: listingDates.data || [],
        notices: notices.data || [],
        defects: defects.data || [],
        orders: orders.data || [],
        reports: reports.data || [],
        similarities: similarities.data || [],
        legalkartCase: legalkartCase.data,
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