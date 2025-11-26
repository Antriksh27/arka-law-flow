import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { SCCaseDetailsCard } from './SCCaseDetailsCard';
import { SCEarlierCourtsTable } from './SCEarlierCourtsTable';
import { SCTaggedMattersTable } from './SCTaggedMattersTable';
import { SCListingHistoryTimeline } from './SCListingHistoryTimeline';
import { SCNoticesTable } from './SCNoticesTable';
import { SCDefectsTable } from './SCDefectsTable';
import { SCJudgementOrdersTable } from './SCJudgementOrdersTable';
import { SCOfficeReportsTable } from './SCOfficeReportsTable';
import { SCSimilaritiesAccordion } from './SCSimilaritiesAccordion';
import { ContactTab } from '../detail/tabs/CaseContactsTab';
import { NotesTab } from '../detail/tabs/NotesTab';
import { TasksTab } from '../detail/tabs/TasksTab';
import { DocumentsTab } from '../detail/tabs/DocumentsTab';
import { ExpensesTab } from '../detail/tabs/ExpensesTab';
import { InvoicesTab } from '../detail/tabs/InvoicesTab';
import { PaymentsTab } from '../detail/tabs/PaymentsTab';
import { TimelineTab } from '../detail/tabs/TimelineTab';
import { LawyersTab } from '../detail/tabs/LawyersTab';
import { RelatedMattersTab } from '../detail/tabs/RelatedMattersTab';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { FileText, File, Scale, StickyNote, CheckSquare, Users, Calendar, XCircle, AlertCircle, Pencil, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface SCCaseDetailViewProps {
  caseId: string;
  caseNumber?: string | string[] | null;
  caseData: any;
  onEdit: () => void;
  onFetchDetails: () => void;
  isRefreshing: boolean;
  isMobile: boolean;
  onAddNote: () => void;
  onAddTask: () => void;
}

export function SCCaseDetailView({ 
  caseId, 
  caseNumber: propCaseNumber,
  caseData,
  onEdit,
  onFetchDetails,
  isRefreshing,
  isMobile,
  onAddNote,
  onAddTask,
}: SCCaseDetailViewProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [caseInfoOpen, setCaseInfoOpen] = useState(true);
  const [nestedTab, setNestedTab] = useState('earlier-courts');
  
  // Fetch Supreme Court case data from database tables AND fetched_data (including raw fetched_data for card)
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
          sr_no: item['S.No.'] ? parseInt(item['S.No.']) : null,
          court_type: item.Court,
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
        // Include raw case details for card display
        rawCaseDetails: caseDetails,
        rawData: rd,
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

  // Extract SC-specific data
  const diaryNumber = scData?.legalkartCase?.diary_number;
  const benchComposition = Array.isArray(scData?.legalkartCase?.bench_composition) 
    ? scData.legalkartCase.bench_composition.join(', ')
    : scData?.legalkartCase?.bench_composition;
  const caseTitle = scData?.legalkartCase?.case_title || caseData.case_title;
  
  // Extract all case details for the card
  const caseDetails = scData?.rawCaseDetails || {};
  const diaryInfo = `Diary No. - ${diaryNumber || '—'}`;
  const diaryNumberFull = caseDetails['Diary Number'] || '—';
  const caseNumberFull = caseDetails['Case Number'] || scData?.caseNumber || caseData.case_number || '—';
  const presentLastListedOn = caseDetails['Present/Last Listed On'] || '—';
  const statusStage = caseDetails['Status/Stage'] || '—';
  const category = caseDetails['Category'] || '—';
  const petitioners = caseDetails['Petitioner(s)'] || '—';
  const respondents = caseDetails['Respondent(s)'] || '—';
  const petitionerAdvocates = caseDetails['Petitioner Advocate(s)'] || '—';
  const respondentAdvocates = caseDetails['Respondent Advocate(s)'] || '—';
  const argumentTranscripts = caseDetails['Argument Transcripts'];
  const indexing = caseDetails['Indexing'];
  
  // Main tab configuration
  const tabs = [
    { value: 'details', label: 'Details', icon: FileText },
    { value: 'contacts', label: 'Contacts', icon: Users },
    { value: 'notes', label: 'Notes', icon: StickyNote },
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
    { value: 'documents', label: 'Documents', icon: File },
    { value: 'expenses', label: 'Expenses', icon: FileText },
    { value: 'invoices', label: 'Invoices', icon: FileText },
    { value: 'payments', label: 'Payments', icon: FileText },
    { value: 'timeline', label: 'Timeline', icon: Calendar },
    { value: 'lawyers', label: 'Lawyers', icon: Users },
    { value: 'related', label: 'Related Matters', icon: Scale },
  ];

  // Nested tabs for Details tab (SC-specific data)
  const nestedTabs = [
    { value: 'earlier-courts', label: 'Earlier Courts', icon: Scale },
    { value: 'listing-history', label: 'Listing History', icon: Calendar },
    { value: 'orders', label: 'Judgement Orders', icon: FileText },
    { value: 'notices', label: 'Notices', icon: AlertCircle },
    { value: 'defects', label: 'Defects', icon: XCircle },
    { value: 'tagged-matters', label: 'Tagged Matters', icon: File },
    { value: 'office-reports', label: 'Office Reports', icon: FileText },
    { value: 'similarities', label: 'Similarities', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        <MobileHeader title={caseTitle || caseData.case_title} showBack />
      ) : null}

      <div className={isMobile ? '' : 'container mx-auto p-6 max-w-7xl'}>
        <div className={isMobile ? '' : 'bg-white border border-border rounded-2xl shadow-sm'}>
          {/* Header Section */}
          {!isMobile && (
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    {caseTitle || caseData.case_title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    {caseData.cnr_number && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">CNR:</span> {caseData.cnr_number}
                      </span>
                    )}
                    {diaryNumber && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Diary:</span> {diaryNumber}
                      </span>
                    )}
                    {caseNumberFull && caseNumberFull !== '—' && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Case No:</span> {caseNumberFull}
                      </span>
                    )}
                    {presentLastListedOn && presentLastListedOn !== '—' && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Last Listed:</span> {presentLastListedOn}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onFetchDetails}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Fetch Details
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Header Card */}
          {isMobile && (
            <div className="p-4 border-b border-border">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {caseTitle || caseData.case_title}
              </h1>
              <div className="text-sm text-gray-600 mb-3">
                <div>CNR: {caseData.cnr_number || '—'}</div>
                {diaryNumber && <div>Diary: {diaryNumber}</div>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={onFetchDetails}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Fetch
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Main Tabs */}
            <TabsList className={`w-full bg-white border-b border-border h-auto p-0 ${isMobile ? 'sticky top-14 z-30' : ''}`}>
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                {tabs.map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-50 bg-transparent rounded-none whitespace-nowrap transition-colors snap-start flex-shrink-0`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {isMobile ? tab.label.split(' ')[0] : tab.label}
                    </TabsTrigger>
                  );
                })}
              </div>
            </TabsList>

            <div className={isMobile ? '' : ''}>
              {/* Details Tab with Case Info Card and Nested Tabs */}
              <TabsContent value="details" className={isMobile ? 'p-4' : 'p-6'}>
                <div className="space-y-6">
                  {/* Case Information Card - Inside Details Tab */}
                  <Collapsible open={caseInfoOpen} onOpenChange={setCaseInfoOpen}>
                    <SCCaseDetailsCard
                      diaryInfo={diaryInfo}
                      caseTitle={caseTitle || caseData.case_title}
                      diaryNumber={diaryNumberFull}
                      caseNumber={caseNumberFull}
                      cnrNumber={caseData.cnr_number || undefined}
                      presentLastListedOn={presentLastListedOn}
                      statusStage={statusStage}
                      category={category}
                      petitioners={petitioners}
                      respondents={respondents}
                      petitionerAdvocates={petitionerAdvocates}
                      respondentAdvocates={respondentAdvocates}
                      argumentTranscripts={argumentTranscripts}
                      indexing={indexing}
                      isOpen={caseInfoOpen}
                      onToggle={setCaseInfoOpen}
                    />
                  </Collapsible>

                  {/* SC-Specific Nested Tabs */}
                  <Card>
                    <CardContent className="p-0">
                      <Tabs value={nestedTab} onValueChange={setNestedTab} className="w-full">
                        <TabsList className="w-full bg-gray-50 border-b border-gray-200 h-auto p-0 rounded-none">
                          <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
                            {nestedTabs.map(tab => {
                              const IconComponent = tab.icon;
                              return (
                                <TabsTrigger 
                                  key={tab.value} 
                                  value={tab.value} 
                                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-50 bg-transparent rounded-none whitespace-nowrap transition-colors"
                                >
                                  <IconComponent className="w-4 h-4" />
                                  {tab.label}
                                </TabsTrigger>
                              );
                            })}
                          </div>
                        </TabsList>

                        {/* Nested Tab Contents */}
                        <div className="p-6">
                          <TabsContent value="earlier-courts" className="m-0">
                            {scData?.earlierCourts && scData.earlierCourts.length > 0 ? (
                              <SCEarlierCourtsTable data={scData.earlierCourts} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">No earlier court details available</p>
                            )}
                          </TabsContent>

                          <TabsContent value="listing-history" className="m-0">
                            {scData?.listingDates && scData.listingDates.length > 0 ? (
                              <SCListingHistoryTimeline data={scData.listingDates} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">No listing history available</p>
                            )}
                          </TabsContent>

                          <TabsContent value="orders" className="m-0">
                            {scData?.orders && scData.orders.length > 0 ? (
                              <SCJudgementOrdersTable data={scData.orders} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">No judgement orders available</p>
                            )}
                          </TabsContent>

                          <TabsContent value="notices" className="m-0">
                            {scData?.notices && scData.notices.length > 0 ? (
                              <SCNoticesTable data={scData.notices} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">No notices available</p>
                            )}
                          </TabsContent>

                          <TabsContent value="defects" className="m-0">
                            {scData?.defects && scData.defects.length > 0 ? (
                              <SCDefectsTable data={scData.defects} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">No defects available</p>
                            )}
                          </TabsContent>

                          <TabsContent value="tagged-matters" className="m-0">
                            {scData?.taggedMatters && scData.taggedMatters.length > 0 ? (
                              <SCTaggedMattersTable data={scData.taggedMatters} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">No tagged matters available</p>
                            )}
                          </TabsContent>

                          <TabsContent value="office-reports" className="m-0">
                            {scData?.reports && scData.reports.length > 0 ? (
                              <SCOfficeReportsTable data={scData.reports} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">No office reports available</p>
                            )}
                          </TabsContent>

                          <TabsContent value="similarities" className="m-0">
                            {scData?.similarities && scData.similarities.length > 0 ? (
                              <SCSimilaritiesAccordion data={scData.similarities} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">No similarities available</p>
                            )}
                          </TabsContent>
                        </div>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

            {/* Common Tabs - Reuse existing components */}
            <TabsContent value="contacts" className={isMobile ? 'p-4' : 'p-6'}>
              <ContactTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="notes" className={isMobile ? 'p-4' : 'p-6'}>
              <NotesTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="tasks" className={isMobile ? 'p-4' : 'p-6'}>
              <TasksTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="documents" className={isMobile ? 'p-4' : 'p-6'}>
              <DocumentsTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="expenses" className={isMobile ? 'p-4' : 'p-6'}>
              <ExpensesTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="invoices" className={isMobile ? 'p-4' : 'p-6'}>
              <InvoicesTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="payments" className={isMobile ? 'p-4' : 'p-6'}>
              <PaymentsTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="timeline" className={isMobile ? 'p-4' : 'p-6'}>
              <TimelineTab 
                caseId={caseId} 
                caseData={caseData} 
                legalkartData={scData?.legalkartCase} 
                hearings={scData?.listingDates || []} 
              />
            </TabsContent>

            <TabsContent value="lawyers" className={isMobile ? 'p-4' : 'p-6'}>
              <LawyersTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="related" className={isMobile ? 'p-4' : 'p-6'}>
              <RelatedMattersTab caseId={caseId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
    </div>
  );
}
