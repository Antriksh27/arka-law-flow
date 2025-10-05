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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{case_title}</h2>
          {cnr_number && <p className="text-sm text-muted-foreground mt-1">CNR: {cnr_number}</p>}
        </div>
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

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={status === 'closed' ? 'outline' : 'default'} className="mt-1">
                  {status || 'Active'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Hearing</p>
                <p className="font-semibold text-base mt-1">
                  {next_hearing_date ? new Date(next_hearing_date).toLocaleDateString() : 'Not scheduled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Court</p>
                <p className="font-semibold text-base mt-1 line-clamp-2">
                  {court_name || court || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="objections">Objections</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Case Numbers */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Hash className="w-5 h-5 text-primary" />
                Case Numbers & Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cnr_number && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">CNR Number</p>
                    <p className="font-semibold">{cnr_number}</p>
                  </div>
                )}
                {filing_number && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Filing Number</p>
                    <p className="font-semibold">{filing_number}</p>
                  </div>
                )}
                {registration_number && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-semibold">{registration_number}</p>
                  </div>
                )}
                {case_type && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Case Type</p>
                    <Badge variant="outline">{case_type}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-5 h-5 text-primary" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filing_date && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Filing Date</p>
                    <p className="font-semibold">{new Date(filing_date).toLocaleDateString()}</p>
                  </div>
                )}
                {registration_date && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Registration Date</p>
                    <p className="font-semibold">{new Date(registration_date).toLocaleDateString()}</p>
                  </div>
                )}
                {next_hearing_date && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Next Hearing</p>
                    <p className="font-semibold text-primary">{new Date(next_hearing_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Court Information */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building className="w-5 h-5 text-primary" />
                Court Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(court_name || court) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Court Name</p>
                    <p className="font-semibold">{court_name || court}</p>
                  </div>
                )}
                {state && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">State</p>
                    <p className="font-semibold">{state}</p>
                  </div>
                )}
                {district && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">District</p>
                    <p className="font-semibold">{district}</p>
                  </div>
                )}
                {bench_type && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Bench Type</p>
                    <p className="font-semibold">{bench_type}</p>
                  </div>
                )}
                {judicial_branch && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Judicial Branch</p>
                    <p className="font-semibold">{judicial_branch}</p>
                  </div>
                )}
                {coram && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Judge/Coram</p>
                    <p className="font-semibold">{coram}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Case Classification */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="w-5 h-5 text-primary" />
                Case Classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stage && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Stage</p>
                    <Badge variant="outline">{stage}</Badge>
                  </div>
                )}
                {category && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline">{category}</Badge>
                  </div>
                )}
                {sub_category && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sub Category</p>
                    <Badge variant="outline">{sub_category}</Badge>
                  </div>
                )}
                {purpose_of_hearing && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Purpose of Hearing</p>
                    <p className="font-semibold">{purpose_of_hearing}</p>
                  </div>
                )}
                {priority && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant={priority === 'high' ? 'error' : 'outline'}>
                      {priority}
                    </Badge>
                  </div>
                )}
              </div>

              {description && (
                <div className="space-y-1 mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm leading-relaxed">{description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legal Provisions */}
          {((acts && acts.length > 0) || (sections && sections.length > 0)) && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Scale className="w-5 h-5 text-primary" />
                  Legal Provisions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {acts && acts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Acts</p>
                    <div className="flex flex-wrap gap-2">
                      {acts.map((act, idx) => (
                        <Badge key={idx} variant="outline" className="bg-primary/5">
                          {act}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {sections && sections.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Sections</p>
                    <div className="flex flex-wrap gap-2">
                      {sections.map((section, idx) => (
                        <Badge key={idx} variant="outline" className="bg-primary/5">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Last Fetched Info */}
          {last_fetched_at && (
            <Card className="rounded-2xl shadow-sm bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Last updated from Legalkart: {new Date(last_fetched_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          {/* Petitioner */}
          {petitioner && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-5 h-5 text-primary" />
                  Petitioner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold text-base">{petitioner}</p>
                </div>
                {petitioner_advocate && (
                  <div className="space-y-1 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Legal Representative</p>
                    <p className="font-semibold text-base">{petitioner_advocate}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Respondent */}
          {respondent && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-5 h-5 text-primary" />
                  Respondent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold text-base">{respondent}</p>
                </div>
                {respondent_advocate && (
                  <div className="space-y-1 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Legal Representative</p>
                    <p className="font-semibold text-base">{respondent_advocate}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Orders */}
          {orders && orders.length > 0 && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Gavel className="w-5 h-5 text-primary" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.map((order, idx) => (
                    <div key={idx} className="p-4 bg-muted/30 rounded-xl">
                      <p className="text-sm leading-relaxed">{order}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
      </Tabs>
    </div>
  );
};
