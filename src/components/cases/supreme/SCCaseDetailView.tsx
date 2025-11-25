import { parseSupremeCourtData } from '@/lib/scCaseDataParser';
import { SCCaseHeader } from './SCCaseHeader';
import { SCCaseInfoSection } from './SCCaseInfoSection';
import { SCPartiesSection } from './SCPartiesSection';
import { SCEarlierCourtsTable } from './SCEarlierCourtsTable';
import { SCTaggedMattersTable } from './SCTaggedMattersTable';
import { SCListingHistoryTimeline } from './SCListingHistoryTimeline';
import { SCNoticesTable } from './SCNoticesTable';
import { SCDefectsTable } from './SCDefectsTable';
import { SCJudgementOrdersTable } from './SCJudgementOrdersTable';
import { SCOfficeReportsTable } from './SCOfficeReportsTable';
import { SCIADocumentsTable } from './SCIADocumentsTable';
import { SCCourtFeesTable } from './SCCourtFeesTable';
import { SCSimilaritiesDisplay } from './SCSimilaritiesDisplay';
import { SCMetadataCard } from './SCMetadataCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface SCCaseDetailViewProps {
  caseData: any;
  legalkartCase?: any;
  rawData?: any;
}

export const SCCaseDetailView = ({ caseData, legalkartCase, rawData }: SCCaseDetailViewProps) => {
  console.log('🏛️ SUPREME COURT VIEW IS RENDERING NOW! 🏛️');
  console.log('Case ID:', caseData?.id);
  console.log('Court:', caseData?.court);
  console.log('CNR:', caseData?.cnr_number);
  
  // Parse the raw fetched data
  const fetchedRawData = rawData || caseData?.fetched_data;
  const parsedData = parseSupremeCourtData(fetchedRawData);

  // Use legalkart case ID if available, otherwise use case ID
  const effectiveCaseId = legalkartCase?.id || caseData?.id;

  console.log('📊 Parsed SC Data:', parsedData);

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* VISUAL MARKER - REMOVE AFTER DEBUGGING */}
      <div className="bg-yellow-400 border-4 border-red-600 p-8 rounded-lg text-center">
        <h1 className="text-4xl font-bold text-red-900 mb-2">
          🏛️ SUPREME COURT VIEW 🏛️
        </h1>
        <p className="text-xl text-red-800">
          Diary Number: {parsedData.diaryNumber || 'Not found'} | CNR: {parsedData.cnrNumber || 'Not found'}
        </p>
        <p className="text-sm text-red-700 mt-2">
          (This banner is for debugging - it will be removed)
        </p>
      </div>

      {/* Header Section */}
      <SCCaseHeader data={parsedData} />

      <Separator className="my-6" />

      {/* Case Info Section */}
      <SCCaseInfoSection data={parsedData} />

      <Separator className="my-6" />

      {/* Parties Section */}
      <SCPartiesSection data={parsedData} />

      <Separator className="my-6" />

      {/* Tabbed Content for Detailed Information */}
      <Tabs defaultValue="earlier-courts" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-2 h-auto">
          <TabsTrigger value="earlier-courts" className="text-xs">Earlier Courts</TabsTrigger>
          <TabsTrigger value="tagged" className="text-xs">Tagged</TabsTrigger>
          <TabsTrigger value="listings" className="text-xs">Listings</TabsTrigger>
          <TabsTrigger value="notices" className="text-xs">Notices</TabsTrigger>
          <TabsTrigger value="defects" className="text-xs">Defects</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
          <TabsTrigger value="ia-docs" className="text-xs">IA Docs</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs">Court Fees</TabsTrigger>
          <TabsTrigger value="similarities" className="text-xs">Similar</TabsTrigger>
          <TabsTrigger value="metadata" className="text-xs">Metadata</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="earlier-courts" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Earlier Court Details</h2>
            <SCEarlierCourtsTable caseId={effectiveCaseId} data={parsedData.earlierCourts} />
          </TabsContent>

          <TabsContent value="tagged" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Tagged / Related Matters</h2>
            <SCTaggedMattersTable caseId={effectiveCaseId} data={parsedData.taggedMatters} />
          </TabsContent>

          <TabsContent value="listings" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Listing History</h2>
            <SCListingHistoryTimeline caseId={effectiveCaseId} data={parsedData.listingDates} />
          </TabsContent>

          <TabsContent value="notices" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Notices</h2>
            <SCNoticesTable caseId={effectiveCaseId} data={parsedData.notices} />
          </TabsContent>

          <TabsContent value="defects" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Defects</h2>
            <SCDefectsTable caseId={effectiveCaseId} data={parsedData.defects} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Judgement Orders</h2>
            <SCJudgementOrdersTable caseId={effectiveCaseId} data={parsedData.orders} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Office Reports</h2>
            <SCOfficeReportsTable caseId={effectiveCaseId} data={parsedData.officeReports} />
          </TabsContent>

          <TabsContent value="ia-docs" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Interlocutory Application Documents</h2>
            <SCIADocumentsTable caseId={effectiveCaseId} data={parsedData.iaDocuments} />
          </TabsContent>

          <TabsContent value="fees" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Court Fees</h2>
            <SCCourtFeesTable caseId={effectiveCaseId} data={parsedData.courtFees} />
          </TabsContent>

          <TabsContent value="similarities" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Similar Cases</h2>
            <SCSimilaritiesDisplay caseId={effectiveCaseId} data={parsedData.similarities} />
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Additional Metadata</h2>
            <SCMetadataCard legalkartCase={legalkartCase} rawData={fetchedRawData} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
