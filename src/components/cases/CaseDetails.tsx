import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, RefreshCw, Edit, Calendar, MapPin, Scale, FileText, Users, Gavel, Building, AlertTriangle } from 'lucide-react';
import { EditCaseDialog } from './EditCaseDialog';
interface CaseDetailsProps {
  caseId: string;
}
export const CaseDetails: React.FC<CaseDetailsProps> = ({
  caseId
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const {
    data: caseData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['case-details-full', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('*').eq('id', caseId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });
  if (isLoading) {
    return <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>;
  }
  if (!caseData) {
    return <div className="text-center py-12">
        <p className="text-muted">Case details not found</p>
      </div>;
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // Extract Legalkart data if available
  const legalkartData = (caseData.fetched_data as any)?.data || {};
  const {
    case_info = {},
    case_status = {},
    category_info = {},
    petitioner_and_advocate = '',
    respondent_and_advocate = '',
    documents = [],
    objections = [],
    order_details = [],
    history_of_case_hearing = [],
    ia_details = []
  } = legalkartData;

  // Generate case title from Legalkart data if available
  const extractName = (text: string) => {
    if (!text) return '';
    
    // Remove leading numbers and parentheses like "1) "
    let cleaned = text.replace(/^\d+\)\s*/, '');
    
    // Remove advocate information and everything after it
    cleaned = cleaned.replace(/\s+Advocate.*$/i, '');
    
    // Extract name before any additional details in parentheses or dashes
    const beforeDetails = cleaned.split(/[-–(]/)[0];
    
    return beforeDetails.trim();
  };
  const legalkartPetitionerName = extractName(petitioner_and_advocate);
  const legalkartRespondentName = extractName(respondent_and_advocate);
  const legalkartCaseTitle = legalkartPetitionerName && legalkartRespondentName ? `${legalkartPetitionerName} Vs ${legalkartRespondentName}` : '';
  const displayTitle = legalkartCaseTitle || caseData.case_title || caseData.title;
  return <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Legalkart Data Integration - data is shown throughout the component */}

      {/* Header Section */}
      

      {/* Parties Section */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Parties Involved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted mb-2">Petitioner</p>
                <p className="font-medium text-foreground">{caseData.petitioner || legalkartPetitionerName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-2">Respondent</p>
                <p className="font-medium text-foreground">{caseData.respondent || legalkartRespondentName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-2">Petitioner's Advocate</p>
                <p className="font-medium text-foreground">{caseData.petitioner_advocate || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-2">Respondent's Advocate</p>
                <p className="font-medium text-foreground">{caseData.respondent_advocate || 'Not specified'}</p>
              </div>
            </div>
            
            {/* Enhanced E-Courts Party Details */}
            {(petitioner_and_advocate || respondent_and_advocate) && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted mb-2">E-Courts Data</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {legalkartPetitionerName && (
                    <div>
                      <span className="font-medium">Petitioner: </span>
                      <span className="text-foreground">{legalkartPetitionerName}</span>
                    </div>
                  )}
                  {legalkartRespondentName && (
                    <div>
                      <span className="font-medium">Respondent: </span>
                      <span className="text-foreground">{legalkartRespondentName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Court Information */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary" />
            Court Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted mb-2">Court Name</p>
              <p className="font-medium text-foreground">{caseData.court_name || caseData.court || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Court Complex</p>
              <p className="font-medium text-foreground">{caseData.court_complex || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Bench Type</p>
              <p className="font-medium text-foreground">{caseData.bench_type || case_status.bench_type || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Judicial Branch</p>
              <p className="font-medium text-foreground">{caseData.judicial_branch || case_status.judicial_branch || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Coram</p>
              <p className="font-medium text-foreground">{caseData.coram || case_status.coram || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Stage of Case</p>
              <p className="font-medium text-foreground">{caseData.stage || case_status.stage_of_case || 'Not specified'}</p>
            </div>
            {case_status['before_me_/_part_heard'] && <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted mb-2">Before Me / Part Heard</p>
                <p className="font-medium text-foreground">{case_status['before_me_/_part_heard']}</p>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Important Dates */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-muted mb-2">Filing Date</p>
              <p className="font-medium text-foreground">
                {caseData.filing_date ? new Date(caseData.filing_date).toLocaleDateString() : case_info.filing_date || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Registration Date</p>
              <p className="font-medium text-foreground">
                {caseData.registration_date ? new Date(caseData.registration_date).toLocaleDateString() : case_info.registration_date || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">First Hearing Date</p>
              <p className="font-medium text-foreground">
                {caseData.first_hearing_date ? new Date(caseData.first_hearing_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Next Hearing Date</p>
              <p className="font-medium text-foreground flex items-center gap-2">
                {case_status.next_hearing_date && <Calendar className="h-4 w-4 text-primary" />}
                {caseData.next_hearing_date ? new Date(caseData.next_hearing_date).toLocaleDateString() : case_status.next_hearing_date || 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Legal Reference */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted mb-2">Advocate Name</p>
                <p className="font-medium text-foreground">{caseData.advocate_name || 'Not specified'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted mb-2">State</p>
                  <p className="font-medium text-foreground">{caseData.state || case_status.state || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted mb-2">District</p>
                  <p className="font-medium text-foreground">{caseData.district || case_status.district || 'Not specified'}</p>
                </div>
              </div>
              {(caseData.state_1 || caseData.district_1) && <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-muted mb-2">State (Secondary)</p>
                    <p className="font-medium text-foreground">{caseData.state_1}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted mb-2">District (Secondary)</p>
                    <p className="font-medium text-foreground">{caseData.district_1}</p>
                  </div>
                </div>}
            </div>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Category & Legal Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted mb-2">Category</p>
                  <p className="font-medium text-foreground">{caseData.category || category_info.category || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted mb-2">Sub Category</p>
                  <p className="font-medium text-foreground">{caseData.sub_category || category_info.sub_category || 'Not specified'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-3">Acts</p>
                {caseData.acts && caseData.acts.length > 0 ? <div className="flex flex-wrap gap-2">
                    {caseData.acts.map((act: string, index: number) => <Badge key={index} variant="outline" className="text-xs border-border text-foreground">
                        {act}
                      </Badge>)}
                  </div> : <p className="text-muted text-sm">No acts specified</p>}
              </div>
              <div>
                <p className="text-sm font-medium text-muted mb-3">Sections</p>
                {caseData.sections && caseData.sections.length > 0 ? <div className="flex flex-wrap gap-2">
                    {caseData.sections.map((section: string, index: number) => <Badge key={index} variant="outline" className="text-xs border-border text-foreground">
                        {section}
                      </Badge>)}
                  </div> : <p className="text-muted text-sm">No sections specified</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Numbers & References */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Case Numbers & References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-muted mb-2">Filing Number</p>
              <p className="font-medium text-foreground font-mono text-sm">
                {caseData.filing_number || case_info.filing_number || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Registration Number</p>
              <p className="font-medium text-foreground font-mono text-sm">
                {caseData.registration_number || case_info.registration_number || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">CNR Number</p>
              <p className="font-medium text-foreground font-mono text-sm">
                {caseData.cnr_number || case_info.cnr_number || 'Not assigned'}
              </p>
            </div>
            {(caseData.case_number || caseData.docket_number) && <>
                {caseData.case_number && <div>
                    <p className="text-sm font-medium text-muted mb-2">Case Number</p>
                    <p className="font-medium text-foreground font-mono text-sm">{caseData.case_number}</p>
                  </div>}
                {caseData.docket_number && <div>
                    <p className="text-sm font-medium text-muted mb-2">Docket Number</p>
                    <p className="font-medium text-foreground font-mono text-sm">{caseData.docket_number}</p>
                  </div>}
              </>}
          </div>
        </CardContent>
      </Card>

      {/* Documentation & Notes */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Documentation & Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {caseData.hearing_notes && <div>
                <p className="text-sm font-medium text-muted mb-3">Hearing Notes</p>
                <div className="bg-soft rounded-xl p-4">
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{caseData.hearing_notes}</p>
                </div>
              </div>}
            
            {caseData.objection && <div>
                <p className="text-sm font-medium text-muted mb-3">Objection</p>
                <div className="bg-soft rounded-xl p-4">
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{caseData.objection}</p>
                </div>
              </div>}

            {caseData.orders && caseData.orders.length > 0 && <div>
                <p className="text-sm font-medium text-muted mb-3">Orders</p>
                <div className="space-y-3">
                  {caseData.orders.map((order: string, index: number) => <div key={index} className="bg-soft rounded-xl p-4">
                      <p className="text-foreground text-sm leading-relaxed">{order}</p>
                    </div>)}
                </div>
              </div>}

            {caseData.document_links && caseData.document_links.length > 0 && <div>
                <p className="text-sm font-medium text-muted mb-3">Document Links</p>
                <div className="space-y-3">
                  {caseData.document_links.map((link: string, index: number) => <div key={index} className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover text-sm underline">
                        Document {index + 1}
                      </a>
                    </div>)}
                </div>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* E-Courts Additional Data Tables */}
      {caseData.fetched_data && <>
          {/* Documents Table */}
          {documents && documents.length > 0 && <Card className="card">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documents Filed (E-Courts)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="table-header">Sr No</TableHead>
                        <TableHead className="table-header">Advocate</TableHead>
                        <TableHead className="table-header">Filed By</TableHead>
                        <TableHead className="table-header">Document No</TableHead>
                        <TableHead className="table-header">Document Filed</TableHead>
                        <TableHead className="table-header">Date of Receiving</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc: any, index: number) => <TableRow key={index}>
                          <TableCell className="text-foreground">{doc.sr_no || index + 1}</TableCell>
                          <TableCell className="text-foreground">{doc.advocate || '-'}</TableCell>
                          <TableCell className="text-foreground">{doc.filed_by || '-'}</TableCell>
                          <TableCell className="text-foreground">{doc.document_no || '-'}</TableCell>
                          <TableCell className="text-foreground">{doc.document_filed || '-'}</TableCell>
                          <TableCell className="text-foreground">{doc.date_of_receiving || '-'}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>}

          {/* Objections Table */}
          {objections && objections.length > 0 && <Card className="card">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Objections (E-Courts)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="table-header">Sr No</TableHead>
                        <TableHead className="table-header">Objection</TableHead>
                        <TableHead className="table-header">Receipt Date</TableHead>
                        <TableHead className="table-header">Scrutiny Date</TableHead>
                        <TableHead className="table-header">Objection Compliance Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {objections.map((obj: any, index: number) => <TableRow key={index}>
                          <TableCell className="text-foreground">{obj.sr_no || index + 1}</TableCell>
                          <TableCell className="text-foreground">{obj.objection || '-'}</TableCell>
                          <TableCell className="text-foreground">{obj.receipt_date || '-'}</TableCell>
                          <TableCell className="text-foreground">{obj.scrutiny_date || '-'}</TableCell>
                          <TableCell className="text-foreground">{obj.objection_compliance_date || '-'}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>}

          {/* Order Details Table */}
          {order_details && order_details.length > 0 && <Card className="card">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-primary" />
                  Order Details (E-Courts)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="table-header">Judge</TableHead>
                        <TableHead className="table-header">Hearing Date</TableHead>
                        <TableHead className="table-header">Order Number</TableHead>
                        <TableHead className="table-header">Bench</TableHead>
                        <TableHead className="table-header">Order Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order_details.map((order: any, index: number) => <TableRow key={index}>
                          <TableCell className="text-foreground">{order.judge || '-'}</TableCell>
                          <TableCell className="text-foreground">{order.hearing_date || '-'}</TableCell>
                          <TableCell className="text-foreground">{order.cause_list_type || '-'}</TableCell>
                          <TableCell className="text-foreground">{order.business_on_date || '-'}</TableCell>
                          <TableCell className="text-foreground">{order.purpose_of_hearing || '-'}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>}

          {/* History of Case Hearing Table */}
          {history_of_case_hearing && history_of_case_hearing.length > 0 && <Card className="card">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-success" />
                  History of Case Hearing (E-Courts)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="table-header">Judge</TableHead>
                        <TableHead className="table-header">Hearing Date</TableHead>
                        <TableHead className="table-header">Cause List Type</TableHead>
                        <TableHead className="table-header">Business on Date</TableHead>
                        <TableHead className="table-header">Purpose of Hearing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history_of_case_hearing.map((hearing: any, index: number) => <TableRow key={index}>
                          <TableCell className="text-foreground">{hearing.judge || '-'}</TableCell>
                          <TableCell className="text-foreground">{hearing.hearing_date || '-'}</TableCell>
                          <TableCell className="text-foreground">{hearing.cause_list_type || '-'}</TableCell>
                          <TableCell className="text-foreground">{hearing.business_on_date || '-'}</TableCell>
                          <TableCell className="text-foreground">{hearing.purpose_of_hearing || '-'}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>}

          {/* IA Details Table */}
          {ia_details && ia_details.length > 0 && <Card className="card">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  IA Details (E-Courts)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="table-header">IA Number</TableHead>
                        <TableHead className="table-header">Party</TableHead>
                        <TableHead className="table-header">Date of Filing</TableHead>
                        <TableHead className="table-header">Next Date</TableHead>
                        <TableHead className="table-header">IA Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ia_details.map((ia: any, index: number) => <TableRow key={index}>
                          <TableCell className="text-foreground">{ia.ia_number || '-'}</TableCell>
                          <TableCell className="text-foreground">{ia.party || '-'}</TableCell>
                          <TableCell className="text-foreground">{ia.date_of__filing || '-'}</TableCell>
                          <TableCell className="text-foreground">{ia.next_date || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={ia.ia_status === 'Pending' ? 'outline' : 'default'} className="border-border text-foreground">
                              {ia.ia_status || '-'}
                            </Badge>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>}
        </>}

      {caseData && <EditCaseDialog open={showEditDialog} onClose={() => setShowEditDialog(false)} caseId={caseId} caseData={caseData} />}
    </div>;
};