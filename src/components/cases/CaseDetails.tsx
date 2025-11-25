import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, MapPin, Scale, FileText, Users, Gavel, Building, 
  RefreshCw, Hash, Clock, Briefcase, User, BookOpen,
  CheckCircle, AlertCircle, Archive, Bell, AlertTriangle, FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LegalkartDocumentsTable } from './legalkart/LegalkartDocumentsTable';
import { LegalkartObjectionsTable } from './legalkart/LegalkartObjectionsTable';
import { LegalkartOrdersTable } from './legalkart/LegalkartOrdersTable';
import { LegalkartHistoryTable } from './legalkart/LegalkartHistoryTable';
import { SCListingHistoryTimeline } from './supreme/SCListingHistoryTimeline';
import { SCNoticesTable } from './supreme/SCNoticesTable';
import { SCDefectsTable } from './supreme/SCDefectsTable';
import { SCJudgementOrdersTable } from './supreme/SCJudgementOrdersTable';
import { SCOfficeReportsTable } from './supreme/SCOfficeReportsTable';
import { TimeUtils } from '@/lib/timeUtils';

interface CaseDetailsProps {
  caseId: string;
}

export const CaseDetails: React.FC<CaseDetailsProps> = ({ caseId }) => {
  const [refreshing, setRefreshing] = useState(false);

  // Query case data - Legalkart data is already mapped to cases table columns
  const { data: caseData, isLoading, refetch } = useQuery({
    queryKey: ['case-details', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast.success('Case details refreshed');
    } catch (error) {
      toast.error('Failed to refresh case details');
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading case details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!caseData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>No case data available.</p>
        </CardContent>
      </Card>
    );
  }

  // All fields are now directly in the cases table
  const {
    cnr_number,
    case_title,
    filing_number,
    registration_number,
    filing_date,
    registration_date,
    next_hearing_date,
    state,
    district,
    bench_type,
    judicial_branch,
    coram,
    stage,
    category,
    sub_category,
    court_name,
    court,
    court_type,
    petitioner,
    petitioner_advocate,
    respondent,
    respondent_advocate,
    status,
    case_type,
    priority,
    description,
    acts,
    sections,
    orders,
    purpose_of_hearing,
    last_fetched_at,
    fetched_data,
  } = caseData;

  // Check if this is a Supreme Court case
  const isSupremeCourt = court_type === 'supreme_court' || 
                         court_name?.toLowerCase().includes('supreme court');

  // Extract nested data - handle both old and new structure
  const fetchedDataRoot = (fetched_data as any) || {};
  const caseDetailsNested = fetchedDataRoot?.case_details || fetchedDataRoot?.["Case Details"] || {};
  const apiData = fetchedDataRoot;
  const documents = apiData?.documents || [];
  const objections = apiData?.objections || [];
  const orderDetails = apiData?.order_details || [];
  const historyData = apiData?.history_of_case_hearing || [];
  
  console.log('SC Data Extraction:', {
    isSupremeCourt,
    court_type,
    fetchedDataRoot: Object.keys(fetchedDataRoot),
    caseDetailsKeys: Object.keys(caseDetailsNested),
    diaryNumber: fetchedDataRoot?.diary_number || fetchedDataRoot?.["Diary Number"]
  });
  
  // Extract Supreme Court specific data from root level and nested "Case Details"
  const scData = isSupremeCourt ? {
    diaryNumber: fetchedDataRoot?.diary_number || fetchedDataRoot?.["Diary Number"] || null,
    scCategory: category || caseDetailsNested?.Category || caseDetailsNested?.["Category"] || null,
    benchComposition: coram || null,
    earlierCourtDetails: caseDetailsNested?.["Earlier Court Details"] || [],
    taggedMatters: caseDetailsNested?.["Tagged Matters"] || [],
    defects: caseDetailsNested?.["Defects"] || [],
    listingDates: caseDetailsNested?.["Listing Dates"] || [],
    judgementOrders: caseDetailsNested?.["Judgement Orders"] || [],
    notices: caseDetailsNested?.["Notices"] || [],
    officeReport: caseDetailsNested?.["Office Report"] || [],
  } : null;

  // Parse petitioner data to separate party name from any embedded text
  const petitionerName = petitioner?.split('Vs')[0]?.trim() || petitioner;
  const petitionerAdvocate = petitioner_advocate;

  // Parse respondent data to separate party name from any embedded text
  const respondentName = respondent?.split('Vs')[0]?.trim() || respondent;
  const respondentAdvocate = respondent_advocate;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/3 to-background border border-primary/10">
        <div className="absolute inset-0 bg-grid-primary/5" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge 
                  variant={status === 'disposed' ? 'outline' : 'default'} 
                  className="px-3 py-1"
                >
                  {status || 'Active'}
                </Badge>
                {case_type && (
                  <Badge variant="outline" className="px-3 py-1 bg-background/50">
                    {case_type}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
                {case_title}
              </h1>
              
              {cnr_number && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-mono">{cnr_number}</span>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="default"
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20 dark:to-background border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Next Hearing</p>
                <p className="text-lg font-semibold text-foreground">
                  {next_hearing_date ? TimeUtils.formatDate(next_hearing_date) : 'Not scheduled'}
                </p>
              </div>
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20 dark:to-background border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Court</p>
                <p className="text-base font-semibold text-foreground line-clamp-2">
                  {court_name || court || 'N/A'}
                </p>
              </div>
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20 dark:to-background border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Stage</p>
                <p className="text-base font-semibold text-foreground">
                  {stage || 'N/A'}
                </p>
              </div>
              <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/20 dark:to-background border-amber-200/50 dark:border-amber-800/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-base font-semibold text-foreground line-clamp-2">
                  {category || sub_category || 'N/A'}
                </p>
              </div>
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supreme Court Specific Section */}
      {isSupremeCourt && scData && (
        <Card className="rounded-2xl border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              Supreme Court Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scData.diaryNumber && (
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Diary Number</p>
                  <p className="text-base font-mono font-semibold">{scData.diaryNumber}</p>
                </div>
              )}
              {scData.scCategory && (
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Category</p>
                  <p className="text-sm font-medium">{scData.scCategory}</p>
                </div>
              )}
              {scData.benchComposition && (
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Bench Composition</p>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-line">{scData.benchComposition}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted/50 p-1.5 gap-1">
          <TabsTrigger value="overview" className="rounded-lg px-6">Overview</TabsTrigger>
          <TabsTrigger value="parties" className="rounded-lg px-6">Parties</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-6">Documents</TabsTrigger>
          <TabsTrigger value="objections" className="rounded-lg px-6">Objections</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg px-6">Orders</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-6">History</TabsTrigger>
          {isSupremeCourt && (
            <>
              <TabsTrigger value="sc-earlier-courts" className="rounded-lg px-6">Earlier Courts</TabsTrigger>
              <TabsTrigger value="sc-tagged" className="rounded-lg px-6">Tagged Matters</TabsTrigger>
              <TabsTrigger value="sc-listings" className="rounded-lg px-6">Listing History</TabsTrigger>
              <TabsTrigger value="sc-notices" className="rounded-lg px-6">Notices</TabsTrigger>
              <TabsTrigger value="sc-defects" className="rounded-lg px-6">Defects</TabsTrigger>
              <TabsTrigger value="sc-judgements" className="rounded-lg px-6">Judgements</TabsTrigger>
              <TabsTrigger value="sc-office-reports" className="rounded-lg px-6">Office Reports</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Case Numbers */}
              <Card className="rounded-2xl border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Hash className="w-4 h-4 text-primary" />
                    </div>
                    Case Identifiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cnr_number && (
                    <div className="flex flex-col space-y-1.5 pb-4 border-b last:border-0 last:pb-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">CNR Number</p>
                      <p className="font-mono font-semibold text-sm">{cnr_number}</p>
                    </div>
                  )}
                  {filing_number && (
                    <div className="flex flex-col space-y-1.5 pb-4 border-b last:border-0 last:pb-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Filing Number</p>
                      <p className="font-mono font-semibold text-sm">{filing_number}</p>
                    </div>
                  )}
                  {registration_number && (
                    <div className="flex flex-col space-y-1.5 pb-4 border-b last:border-0 last:pb-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Registration Number</p>
                      <p className="font-mono font-semibold text-sm">{registration_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Important Dates */}
              <Card className="rounded-2xl border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filing_date && (
                    <div className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Filing Date</p>
                        <p className="font-semibold text-sm">{TimeUtils.formatDate(filing_date)}</p>
                      </div>
                    </div>
                  )}
                  {registration_date && (
                    <div className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Registration Date</p>
                        <p className="font-semibold text-sm">{TimeUtils.formatDate(registration_date)}</p>
                      </div>
                    </div>
                  )}
                  {next_hearing_date && (
                    <div className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Next Hearing</p>
                        <p className="font-semibold text-sm text-primary">{TimeUtils.formatDate(next_hearing_date)}</p>
                      </div>
                    </div>
                  )}
                  {purpose_of_hearing && (
                    <div className="pt-4 border-t">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Purpose</p>
                      <p className="text-sm leading-relaxed">{purpose_of_hearing}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Legal Provisions */}
              {((acts && acts.length > 0) || (sections && sections.length > 0)) && (
                <Card className="rounded-2xl border-l-4 border-l-amber-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      Legal Provisions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {acts && acts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Acts</p>
                        <div className="flex flex-wrap gap-2">
                          {acts.map((act, idx) => (
                            <Badge key={idx} variant="outline" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100">
                              {act}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {sections && sections.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Sections</p>
                        <div className="flex flex-wrap gap-2">
                          {sections.map((section, idx) => (
                            <Badge key={idx} variant="outline" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Court Information */}
              <Card className="rounded-2xl border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Court Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(court_name || court) && (
                    <div className="space-y-1.5 pb-4 border-b">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Court Name</p>
                      <p className="font-semibold text-sm leading-relaxed">{court_name || court}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {state && (
                      <div className="space-y-1.5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">State</p>
                        <p className="font-semibold text-sm">{state}</p>
                      </div>
                    )}
                    {district && (
                      <div className="space-y-1.5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">District</p>
                        <p className="font-semibold text-sm">{district}</p>
                      </div>
                    )}
                  </div>
                  {bench_type && (
                    <div className="space-y-1.5 pt-4 border-t">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Bench Type</p>
                      <Badge variant="outline" className="font-normal">{bench_type}</Badge>
                    </div>
                  )}
                  {judicial_branch && (
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Judicial Branch</p>
                      <p className="font-semibold text-sm">{judicial_branch}</p>
                    </div>
                  )}
                  {coram && (
                    <div className="space-y-1.5 pt-4 border-t">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Judge/Coram</p>
                      <p className="font-semibold text-sm leading-relaxed">{coram}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Case Classification */}
              <Card className="rounded-2xl border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    Case Classification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {stage && (
                      <div className="space-y-1.5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Stage</p>
                        <Badge variant="outline" className="font-normal">{stage}</Badge>
                      </div>
                    )}
                    {category && (
                      <div className="space-y-1.5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Category</p>
                        <Badge variant="outline" className="font-normal">{category}</Badge>
                      </div>
                    )}
                  </div>
                  {sub_category && (
                    <div className="space-y-1.5 pt-4 border-t">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Sub Category</p>
                      <Badge variant="outline" className="font-normal">{sub_category}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Orders */}
              {orders && orders.length > 0 && (
                <Card className="rounded-2xl border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <Gavel className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      Court Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orders.map((order, idx) => (
                        <div key={idx} className="p-4 bg-muted/40 rounded-xl border border-muted-foreground/10">
                          <p className="text-sm leading-relaxed">{order}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Full Width Description */}
          {description && (
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  Case Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          )}

          {/* Last Fetched Info */}
          {last_fetched_at && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <Clock className="w-4 h-4" />
              <span>Last synced from Legalkart: {new Date(last_fetched_at).toLocaleString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="parties" className="space-y-6 mt-6">
          {/* Petitioners Table */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Petitioners
            </h3>
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Advocate Name</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Extract from fetched_data or fallback to manual data
                    const legalkartData = (caseData?.fetched_data as any)?.data || {};
                    const petitionerString = legalkartData.petitioner_and_advocate || caseData?.petitioner || '';
                    
                    // Split by comma for multiple parties
                    const parties = petitionerString.split(',').map(p => p.trim()).filter(p => p);
                    
                    if (parties.length === 0) {
                      return (
                        <tr>
                          <td colSpan={2} className="text-center py-8 text-muted-foreground">
                            No petitioner information available
                          </td>
                        </tr>
                      );
                    }
                    
                    return parties.map((party, index) => {
                      // Remove leading numbers like "1) "
                      let cleaned = party.replace(/^\d+\)\s*/, '');
                      
                      // Split by "Advocate" keyword
                      const parts = cleaned.split(/\s+Advocate\s+/i);
                      const name = parts[0]?.trim() || '-';
                      const advocate = parts[1]?.trim() || '-';
                      
                      return (
                        <tr key={index} className="border-t">
                          <td className="py-3 px-4 font-medium">{name}</td>
                          <td className="py-3 px-4">{advocate}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Respondents Table */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              Respondents
            </h3>
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Advocate Name</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const legalkartData = (caseData?.fetched_data as any)?.data || {};
                    const respondentString = legalkartData.respondent_and_advocate || caseData?.respondent || '';
                    
                    // Split by comma for multiple parties
                    const parties = respondentString.split(',').map(p => p.trim()).filter(p => p);
                    
                    if (parties.length === 0) {
                      return (
                        <tr>
                          <td colSpan={2} className="text-center py-8 text-muted-foreground">
                            No respondent information available
                          </td>
                        </tr>
                      );
                    }
                    
                    return parties.map((party, index) => {
                      // Remove leading numbers like "1) "
                      let cleaned = party.replace(/^\d+\)\s*/, '');
                      
                      // Split by "Advocate" keyword
                      const parts = cleaned.split(/\s+Advocate\s+/i);
                      const name = parts[0]?.trim() || '-';
                      const advocate = parts[1]?.trim() || '-';
                      
                      return (
                        <tr key={index} className="border-t">
                          <td className="py-3 px-4 font-medium">{name}</td>
                          <td className="py-3 px-4">{advocate}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5 text-primary" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LegalkartDocumentsTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objections">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="w-5 h-5 text-primary" />
                Objections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LegalkartObjectionsTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Gavel className="w-5 h-5 text-primary" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LegalkartOrdersTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="w-5 h-5 text-primary" />
                Case History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LegalkartHistoryTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supreme Court Specific Tabs */}
        {isSupremeCourt && scData && (
          <>
            <TabsContent value="sc-earlier-courts" className="space-y-6 mt-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building className="w-5 h-5 text-primary" />
                    Earlier Court Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scData.earlierCourtDetails.length > 0 ? (
                    <div className="space-y-4">
                      {scData.earlierCourtDetails.map((court: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{court.court_name || 'Court Name Not Available'}</p>
                              <p className="text-sm text-muted-foreground">{court.case_no || 'Case Number Not Available'}</p>
                            </div>
                            {court.judgement && (
                              <Badge variant={court.judgement.toLowerCase().includes('allow') ? 'default' : 'outline'}>
                                {court.judgement}
                              </Badge>
                            )}
                          </div>
                          {court.order_date && (
                            <p className="text-sm text-muted-foreground">Order Date: {court.order_date}</p>
                          )}
                          {court.judges && (
                            <p className="text-sm">Judges: {court.judges}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No earlier court details available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sc-tagged" className="space-y-6 mt-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="w-5 h-5 text-primary" />
                    Tagged/Related Matters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scData.taggedMatters.length > 0 ? (
                    <div className="space-y-3">
                      {scData.taggedMatters.map((matter: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-mono text-sm text-muted-foreground">{matter.tagged_case_number || matter.case_no}</p>
                              <p className="font-medium mt-1">{matter.petitioner_vs_respondent || matter.case_title}</p>
                            </div>
                            <Badge variant={matter.matter_status === 'P' ? 'default' : 'outline'}>
                              {matter.matter_status === 'P' ? 'Pending' : 'Disposed'}
                            </Badge>
                          </div>
                          {matter.ia_info && (
                            <p className="text-xs text-muted-foreground mt-2">IA: {matter.ia_info}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No tagged matters available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Listing History Tab */}
            <TabsContent value="sc-listings" className="space-y-6 mt-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                    Listing History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SCListingHistoryTimeline caseId={caseId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notices Tab */}
            <TabsContent value="sc-notices" className="space-y-6 mt-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Bell className="w-5 h-5 text-primary" />
                    Notices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SCNoticesTable caseId={caseId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Defects Tab */}
            <TabsContent value="sc-defects" className="space-y-6 mt-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Defects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SCDefectsTable caseId={caseId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Judgements Tab */}
            <TabsContent value="sc-judgements" className="space-y-6 mt-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Gavel className="w-5 h-5 text-primary" />
                    Judgement Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SCJudgementOrdersTable caseId={caseId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Office Reports Tab */}
            <TabsContent value="sc-office-reports" className="space-y-6 mt-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileCheck className="w-5 h-5 text-primary" />
                    Office Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SCOfficeReportsTable caseId={caseId} />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};
