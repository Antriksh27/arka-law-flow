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
        <p className="text-gray-500">Case details not found</p>
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
    const match = text.match(/^(\d+\)\s*)?([^A-Z]*?)(?:\s+Advocate|$)/);
    return match ? match[2].trim() : text.split(' ')[0] || '';
  };

  const legalkartPetitionerName = extractName(petitioner_and_advocate);
  const legalkartRespondentName = extractName(respondent_and_advocate);
  const legalkartCaseTitle = legalkartPetitionerName && legalkartRespondentName 
    ? `${legalkartPetitionerName} Vs ${legalkartRespondentName}` 
    : '';

  const displayTitle = legalkartCaseTitle || caseData.case_title || caseData.title;

  return <div className="space-y-6">
      {/* Legalkart Data Notification */}
      {caseData.fetched_data && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-blue-800 font-medium">
                Enhanced with Legalkart Data
              </p>
              <p className="text-blue-700 text-sm">
                This case includes comprehensive data from e-Courts. 
                {caseData.last_fetched_at && <span> Last updated: {new Date(caseData.last_fetched_at).toLocaleString()}</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 mb-2">
                <Scale className="w-6 h-6 text-blue-600" />
                {displayTitle}
                {caseData.fetched_data && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    E-Courts Data
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-3 mb-3">
                <Badge className={getStatusColor(caseData.status)}>
                  {caseData.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                {caseData.stage && <Badge variant="outline" className="text-gray-700 border-gray-300">
                    {caseData.stage}
                  </Badge>}
                {caseData.priority && <Badge variant="outline" className={caseData.priority === 'high' ? 'text-red-700 border-red-300' : caseData.priority === 'medium' ? 'text-yellow-700 border-yellow-300' : 'text-green-700 border-green-300'}>
                    {caseData.priority} priority
                  </Badge>}
              </div>
              {caseData.description && <p className="text-gray-600 text-sm">{caseData.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowEditDialog(true)} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Case Info
              </Button>
              <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Parties Section */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Users className="w-5 h-5 text-blue-600" />
            Parties Involved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Petitioner</p>
                <p className="font-medium text-gray-900">{caseData.petitioner || legalkartPetitionerName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Respondent</p>
                <p className="font-medium text-gray-900">{caseData.respondent || legalkartRespondentName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Petitioner's Advocate</p>
                <p className="font-medium text-gray-900">{caseData.petitioner_advocate || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Respondent's Advocate</p>
                <p className="font-medium text-gray-900">{caseData.respondent_advocate || 'Not specified'}</p>
              </div>
            </div>
            
            {/* Enhanced Legalkart Party Details */}
            {(petitioner_and_advocate || respondent_and_advocate) && (
              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-medium text-gray-500 mb-3">Detailed Party Information (E-Courts)</p>
                {petitioner_and_advocate && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Petitioner & Advocate Details</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{petitioner_and_advocate}</p>
                  </div>
                )}
                {respondent_and_advocate && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Respondent & Advocate Details</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{respondent_and_advocate}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Court Information */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Gavel className="w-5 h-5 text-blue-600" />
            Court Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Court Name</p>
              <p className="font-medium text-gray-900">{caseData.court_name || caseData.court || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Court Complex</p>
              <p className="font-medium text-gray-900">{caseData.court_complex || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Bench Type</p>
              <p className="font-medium text-gray-900">{caseData.bench_type || case_status.bench_type || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Judicial Branch</p>
              <p className="font-medium text-gray-900">{caseData.judicial_branch || case_status.judicial_branch || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Coram</p>
              <p className="font-medium text-gray-900">{caseData.coram || case_status.coram || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Stage of Case</p>
              <p className="font-medium text-gray-900">{caseData.stage || case_status.stage_of_case || 'Not specified'}</p>
            </div>
            {case_status['before_me_/_part_heard'] && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">Before Me / Part Heard</p>
                <p className="font-medium text-gray-900">{case_status['before_me_/_part_heard']}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Dates */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="w-5 h-5 text-blue-600" />
            Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Filing Date</p>
              <p className="font-medium text-gray-900">
                {caseData.filing_date ? new Date(caseData.filing_date).toLocaleDateString() : 
                 case_info.filing_date || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Registration Date</p>
              <p className="font-medium text-gray-900">
                {caseData.registration_date ? new Date(caseData.registration_date).toLocaleDateString() : 
                 case_info.registration_date || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">First Hearing Date</p>
              <p className="font-medium text-gray-900">
                {caseData.first_hearing_date ? new Date(caseData.first_hearing_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Next Hearing Date</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                {case_status.next_hearing_date && <Calendar className="h-4 w-4 text-blue-600" />}
                {caseData.next_hearing_date ? new Date(caseData.next_hearing_date).toLocaleDateString() : 
                 case_status.next_hearing_date || 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Legal Reference */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="w-5 h-5 text-blue-600" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Advocate Name</p>
                <p className="font-medium text-gray-900">{caseData.advocate_name || 'Not specified'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">State</p>
                  <p className="font-medium text-gray-900">{caseData.state || case_status.state || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">District</p>
                  <p className="font-medium text-gray-900">{caseData.district || case_status.district || 'Not specified'}</p>
                </div>
              </div>
              {(caseData.state_1 || caseData.district_1) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">State (Secondary)</p>
                    <p className="font-medium text-gray-900">{caseData.state_1}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">District (Secondary)</p>
                    <p className="font-medium text-gray-900">{caseData.district_1}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Building className="w-5 h-5 text-blue-600" />
              Category & Legal Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{caseData.category || category_info.category || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Sub Category</p>
                  <p className="font-medium text-gray-900">{caseData.sub_category || category_info.sub_category || 'Not specified'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Acts</p>
                {caseData.acts && caseData.acts.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {caseData.acts.map((act: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {act}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No acts specified</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Sections</p>
                {caseData.sections && caseData.sections.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {caseData.sections.map((section: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No sections specified</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Numbers & References */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="w-5 h-5 text-blue-600" />
            Case Numbers & References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Filing Number</p>
              <p className="font-medium text-gray-900 font-mono text-sm">
                {caseData.filing_number || case_info.filing_number || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Registration Number</p>
              <p className="font-medium text-gray-900 font-mono text-sm">
                {caseData.registration_number || case_info.registration_number || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">CNR Number</p>
              <p className="font-medium text-gray-900 font-mono text-sm">
                {caseData.cnr_number || case_info.cnr_number || 'Not assigned'}
              </p>
            </div>
            {(caseData.case_number || caseData.docket_number) && (
              <>
                {caseData.case_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Case Number</p>
                    <p className="font-medium text-gray-900 font-mono text-sm">{caseData.case_number}</p>
                  </div>
                )}
                {caseData.docket_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Docket Number</p>
                    <p className="font-medium text-gray-900 font-mono text-sm">{caseData.docket_number}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentation & Notes */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="w-5 h-5 text-blue-600" />
            Documentation & Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {caseData.hearing_notes && <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Hearing Notes</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{caseData.hearing_notes}</p>
                </div>
              </div>}
            
            {caseData.objection && <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Objection</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{caseData.objection}</p>
                </div>
              </div>}

            {caseData.orders && caseData.orders.length > 0 && <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Orders</p>
                <div className="space-y-2">
                  {caseData.orders.map((order: string, index: number) => <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-700 text-sm">{order}</p>
                    </div>)}
                </div>
              </div>}

            {caseData.document_links && caseData.document_links.length > 0 && <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Document Links</p>
                <div className="space-y-2">
                  {caseData.document_links.map((link: string, index: number) => <div key={index} className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm underline">
                        Document {index + 1}
                      </a>
                    </div>)}
                </div>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* E-Courts Additional Data Tables */}
      {caseData.fetched_data && (
        <>
          {/* Documents Table */}
          {documents && documents.length > 0 && (
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Documents Filed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sr No</TableHead>
                        <TableHead>Advocate</TableHead>
                        <TableHead>Filed By</TableHead>
                        <TableHead>Document No</TableHead>
                        <TableHead>Document Filed</TableHead>
                        <TableHead>Date of Receiving</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{doc.sr_no || index + 1}</TableCell>
                          <TableCell>{doc.advocate || '-'}</TableCell>
                          <TableCell>{doc.filed_by || '-'}</TableCell>
                          <TableCell>{doc.document_no || '-'}</TableCell>
                          <TableCell>{doc.document_filed || '-'}</TableCell>
                          <TableCell>{doc.date_of_receiving || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Objections Table */}
          {objections && objections.length > 0 && (
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Objections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sr No</TableHead>
                        <TableHead>Objection</TableHead>
                        <TableHead>Receipt Date</TableHead>
                        <TableHead>Scrutiny Date</TableHead>
                        <TableHead>Objection Compliance Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {objections.map((obj: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{obj.sr_no || index + 1}</TableCell>
                          <TableCell>{obj.objection || '-'}</TableCell>
                          <TableCell>{obj.receipt_date || '-'}</TableCell>
                          <TableCell>{obj.scrutiny_date || '-'}</TableCell>
                          <TableCell>{obj.objection_compliance_date || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Details Table */}
          {order_details && order_details.length > 0 && (
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-purple-600" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judge</TableHead>
                        <TableHead>Hearing Date</TableHead>
                        <TableHead>Order Number</TableHead>
                        <TableHead>Bench</TableHead>
                        <TableHead>Order Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order_details.map((order: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{order.judge || '-'}</TableCell>
                          <TableCell>{order.hearing_date || '-'}</TableCell>
                          <TableCell>{order.cause_list_type || '-'}</TableCell>
                          <TableCell>{order.business_on_date || '-'}</TableCell>
                          <TableCell>{order.purpose_of_hearing || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History of Case Hearing Table */}
          {history_of_case_hearing && history_of_case_hearing.length > 0 && (
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  History of Case Hearing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judge</TableHead>
                        <TableHead>Hearing Date</TableHead>
                        <TableHead>Cause List Type</TableHead>
                        <TableHead>Business on Date</TableHead>
                        <TableHead>Purpose of Hearing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history_of_case_hearing.map((hearing: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{hearing.judge || '-'}</TableCell>
                          <TableCell>{hearing.hearing_date || '-'}</TableCell>
                          <TableCell>{hearing.cause_list_type || '-'}</TableCell>
                          <TableCell>{hearing.business_on_date || '-'}</TableCell>
                          <TableCell>{hearing.purpose_of_hearing || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* IA Details Table */}
          {ia_details && ia_details.length > 0 && (
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-indigo-600" />
                  IA Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IA Number</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Date of Filing</TableHead>
                        <TableHead>Next Date</TableHead>
                        <TableHead>IA Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ia_details.map((ia: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{ia.ia_number || '-'}</TableCell>
                          <TableCell>{ia.party || '-'}</TableCell>
                          <TableCell>{ia.date_of__filing || '-'}</TableCell>
                          <TableCell>{ia.next_date || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={ia.ia_status === 'Pending' ? 'outline' : 'default'}>
                              {ia.ia_status || '-'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {caseData && <EditCaseDialog open={showEditDialog} onClose={() => setShowEditDialog(false)} caseId={caseId} caseData={caseData} />}
    </div>;
};