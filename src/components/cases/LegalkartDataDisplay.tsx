import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Gavel, Users, Building, Scale } from 'lucide-react';

interface LegalkartDataDisplayProps {
  data: any;
}

export const LegalkartDataDisplay: React.FC<LegalkartDataDisplayProps> = ({ data }) => {
  if (!data || !data.success || !data.data) {
    return null;
  }

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
  } = data.data;

  // Extract petitioner and respondent names for case title
  const extractName = (text: string) => {
    if (!text) return '';
    // Extract the first name before "Advocate-" or other patterns
    const match = text.match(/^(\d+\)\s*)?([^A-Z]*?)(?:\s+Advocate|$)/);
    return match ? match[2].trim() : text.split(' ')[0] || '';
  };

  const petitionerName = extractName(petitioner_and_advocate);
  const respondentName = extractName(respondent_and_advocate);
  const caseTitle = petitionerName && respondentName ? `${petitionerName} Vs ${respondentName}` : '';

  return (
    <div className="space-y-6">
      {/* Case Title */}
      {caseTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">{caseTitle}</h2>
          <Badge variant="outline" className="mt-2">
            Legalkart Data
          </Badge>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Case Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {case_info.cnr_number && (
              <div className="flex justify-between">
                <span className="font-medium">CNR Number:</span>
                <span className="font-mono text-sm">{case_info.cnr_number}</span>
              </div>
            )}
            {case_info.filing_date && (
              <div className="flex justify-between">
                <span className="font-medium">Filing Date:</span>
                <span>{case_info.filing_date}</span>
              </div>
            )}
            {case_info.filing_number && (
              <div className="flex justify-between">
                <span className="font-medium">Filing Number:</span>
                <span>{case_info.filing_number}</span>
              </div>
            )}
            {case_info.registration_date && (
              <div className="flex justify-between">
                <span className="font-medium">Registration Date:</span>
                <span>{case_info.registration_date}</span>
              </div>
            )}
            {case_info.registration_number && (
              <div className="flex justify-between">
                <span className="font-medium">Registration Number:</span>
                <span>{case_info.registration_number}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Case Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {case_status.coram && (
              <div className="flex justify-between">
                <span className="font-medium">Coram:</span>
                <span className="text-right">{case_status.coram}</span>
              </div>
            )}
            {case_status.state && (
              <div className="flex justify-between">
                <span className="font-medium">State:</span>
                <span>{case_status.state}</span>
              </div>
            )}
            {case_status.district && (
              <div className="flex justify-between">
                <span className="font-medium">District:</span>
                <span>{case_status.district}</span>
              </div>
            )}
            {case_status.bench_type && (
              <div className="flex justify-between">
                <span className="font-medium">Bench Type:</span>
                <span>{case_status.bench_type}</span>
              </div>
            )}
            {case_status.stage_of_case && (
              <div className="flex justify-between">
                <span className="font-medium">Stage of Case:</span>
                <span className="text-right">{case_status.stage_of_case}</span>
              </div>
            )}
            {case_status.judicial_branch && (
              <div className="flex justify-between">
                <span className="font-medium">Judicial Branch:</span>
                <span>{case_status.judicial_branch}</span>
              </div>
            )}
            {case_status.next_hearing_date && (
              <div className="flex justify-between">
                <span className="font-medium">Next Hearing Date:</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {case_status.next_hearing_date}
                </span>
              </div>
            )}
            {case_status['before_me_/_part_heard'] && (
              <div className="flex justify-between">
                <span className="font-medium">Before Me/Part Heard:</span>
                <span>{case_status['before_me_/_part_heard']}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Category Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {category_info.category && (
              <div>
                <span className="font-medium">Category:</span>
                <p className="text-sm mt-1">{category_info.category}</p>
              </div>
            )}
            {category_info.sub_category && (
              <div>
                <span className="font-medium">Sub Category:</span>
                <p className="text-sm mt-1">{category_info.sub_category}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Petitioner & Advocate Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Petitioner & Advocate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {petitioner_and_advocate && (
              <div>
                <span className="font-medium">Details:</span>
                <p className="text-sm mt-1">{petitioner_and_advocate}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Respondent & Advocate Card - Full width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Respondent & Advocate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {respondent_and_advocate && (
            <div>
              <span className="font-medium">Details:</span>
              <p className="text-sm mt-1">{respondent_and_advocate}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Table */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>List of documents filed in the case</CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle>Objections</CardTitle>
            <CardDescription>List of objections and their status</CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Court orders and judgments</CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle>History of Case Hearing</CardTitle>
            <CardDescription>Timeline of court hearings</CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle>IA Details</CardTitle>
            <CardDescription>Interlocutory Applications</CardDescription>
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
                        <Badge variant={ia.ia_status === 'Pending' ? 'warning' : 'default'}>
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
    </div>
  );
};