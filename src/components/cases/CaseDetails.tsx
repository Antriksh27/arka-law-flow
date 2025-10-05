import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, MapPin, Scale, FileText, Users, Gavel, Building, 
  RefreshCw, Hash, Clock, Briefcase, User, BookOpen, Flag,
  CheckCircle, AlertCircle, Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LegalkartDocumentsTable } from './legalkart/LegalkartDocumentsTable';
import { LegalkartObjectionsTable } from './legalkart/LegalkartObjectionsTable';
import { LegalkartOrdersTable } from './legalkart/LegalkartOrdersTable';
import { LegalkartHistoryTable } from './legalkart/LegalkartHistoryTable';

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

  // Extract nested data for the tabs (documents, objections, etc.)
  const apiData = (fetched_data as any)?.data || {};
  const documents = apiData?.documents || [];
  const objections = apiData?.objections || [];
  const orderDetails = apiData?.order_details || [];
  const historyData = apiData?.history_of_case_hearing || [];

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Case Details</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="objections">Objections</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cnr_number && (
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">CNR Number</p>
                      <p className="font-medium">{cnr_number}</p>
                    </div>
                  </div>
                )}

                {filing_number && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Filing Number</p>
                      <p className="font-medium">{filing_number}</p>
                    </div>
                  </div>
                )}

                {registration_number && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Number</p>
                      <p className="font-medium">{registration_number}</p>
                    </div>
                  </div>
                )}

                {status && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={status === 'closed' ? 'outline' : 'default'}>
                        {status}
                      </Badge>
                    </div>
                  </div>
                )}

                {filing_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Filing Date</p>
                      <p className="font-medium">{filing_date}</p>
                    </div>
                  </div>
                )}

                {registration_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Date</p>
                      <p className="font-medium">{registration_date}</p>
                    </div>
                  </div>
                )}

                {next_hearing_date && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Next Hearing</p>
                      <p className="font-medium">{next_hearing_date}</p>
                    </div>
                  </div>
                )}

                {(court_name || court) && (
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Court</p>
                      <p className="font-medium">{court_name || court}</p>
                    </div>
                  </div>
                )}

                {state && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">State</p>
                      <p className="font-medium">{state}</p>
                    </div>
                  </div>
                )}

                {district && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">District</p>
                      <p className="font-medium">{district}</p>
                    </div>
                  </div>
                )}

                {bench_type && (
                  <div className="flex items-start gap-3">
                    <Gavel className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bench Type</p>
                      <p className="font-medium">{bench_type}</p>
                    </div>
                  </div>
                )}

                {judicial_branch && (
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Judicial Branch</p>
                      <p className="font-medium">{judicial_branch}</p>
                    </div>
                  </div>
                )}

                {coram && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Judge/Coram</p>
                      <p className="font-medium">{coram}</p>
                    </div>
                  </div>
                )}

                {stage && (
                  <div className="flex items-start gap-3">
                    <Flag className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Stage</p>
                      <p className="font-medium">{stage}</p>
                    </div>
                  </div>
                )}

                {category && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{category}</p>
                    </div>
                  </div>
                )}

                {sub_category && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sub Category</p>
                      <p className="font-medium">{sub_category}</p>
                    </div>
                  </div>
                )}

                {purpose_of_hearing && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Purpose of Hearing</p>
                      <p className="font-medium">{purpose_of_hearing}</p>
                    </div>
                  </div>
                )}

                {case_type && (
                  <div className="flex items-start gap-3">
                    <Scale className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Case Type</p>
                      <Badge>{case_type}</Badge>
                    </div>
                  </div>
                )}

                {priority && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Priority</p>
                      <Badge variant={priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'default'}>
                        {priority}
                      </Badge>
                    </div>
                  </div>
                )}

                {description && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <FileText className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium">{description}</p>
                    </div>
                  </div>
                )}

                {acts && acts.length > 0 && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Scale className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Acts</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {acts.map((act, idx) => (
                          <Badge key={idx} variant="outline">{act}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {sections && sections.length > 0 && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <BookOpen className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sections</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sections.map((section, idx) => (
                          <Badge key={idx} variant="outline">{section}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {last_fetched_at && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Fetched</p>
                      <p className="font-medium text-sm">{new Date(last_fetched_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Party Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {petitioner && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Petitioner
                  </h4>
                  <p className="text-sm mb-1">{petitioner}</p>
                  {petitioner_advocate && (
                    <p className="text-sm text-muted-foreground">
                      Advocate: {petitioner_advocate}
                    </p>
                  )}
                </div>
              )}

              {respondent && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Respondent
                  </h4>
                  <p className="text-sm mb-1">{respondent}</p>
                  {respondent_advocate && (
                    <p className="text-sm text-muted-foreground">
                      Advocate: {respondent_advocate}
                    </p>
                  )}
                </div>
              )}

              {orders && orders.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Gavel className="w-4 h-4" />
                    Orders
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {orders.map((order, idx) => (
                      <li key={idx} className="text-sm">{order}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <LegalkartDocumentsTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objections">
          <Card>
            <CardHeader>
              <CardTitle>Objections</CardTitle>
            </CardHeader>
            <CardContent>
              <LegalkartObjectionsTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <LegalkartOrdersTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Case History</CardTitle>
            </CardHeader>
            <CardContent>
              <LegalkartHistoryTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
