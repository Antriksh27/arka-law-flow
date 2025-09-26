import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, AlertTriangle, Edit, Calendar, MapPin, Scale, FileText, Users, Gavel } from 'lucide-react';
import { EditCaseDialog } from './EditCaseDialog';
import { LegalkartDataDisplay } from './LegalkartDataDisplay';
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
  return <div className="space-y-6">
      {/* Legalkart Data Notification */}
      {caseData.fetched_data && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-blue-800 font-medium">
                Legalkart Data Available
              </p>
              <p className="text-blue-700 text-sm">
                This case includes data fetched from Legalkart API. 
                {caseData.last_fetched_at && <span> Last updated: {new Date(caseData.last_fetched_at).toLocaleString()}</span>}
              </p>
            </div>
          </div>
        </div>}

      {/* Display Legalkart Data if available */}
      {caseData.fetched_data && <LegalkartDataDisplay data={caseData.fetched_data} />}

      {/* Header Section */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 mb-2">
                <Scale className="w-6 h-6 text-blue-600" />
                {caseData.case_title || caseData.title}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Petitioner</p>
              <p className="font-medium text-gray-900">{caseData.petitioner || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Respondent</p>
              <p className="font-medium text-gray-900">{caseData.respondent || 'Not specified'}</p>
            </div>
            {caseData.vs && <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">Case Title (VS)</p>
                <p className="font-medium text-gray-900">{caseData.vs}</p>
              </div>}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Petitioner's Advocate</p>
              <p className="font-medium text-gray-900">{caseData.petitioner_advocate || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Respondent's Advocate</p>
              <p className="font-medium text-gray-900">{caseData.respondent_advocate || 'Not specified'}</p>
            </div>
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
              <p className="font-medium text-gray-900">{caseData.bench_type || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Judicial Branch</p>
              <p className="font-medium text-gray-900">{caseData.judicial_branch || 'Not specified'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1">Coram</p>
              <p className="font-medium text-gray-900">{caseData.coram || 'Not specified'}</p>
            </div>
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
                {caseData.filing_date ? new Date(caseData.filing_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Registration Date</p>
              <p className="font-medium text-gray-900">
                {caseData.registration_date ? new Date(caseData.registration_date).toLocaleDateString() : 'Not set'}
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
              <p className="font-medium text-gray-900">
                {caseData.next_hearing_date ? new Date(caseData.next_hearing_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advocate & Location */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="w-5 h-5 text-blue-600" />
            Advocate & Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Advocate Name</p>
              <p className="font-medium text-gray-900">{caseData.advocate_name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">State</p>
              <p className="font-medium text-gray-900">{caseData.state || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">District</p>
              <p className="font-medium text-gray-900">{caseData.district || 'Not specified'}</p>
            </div>
            {(caseData.state_1 || caseData.district_1) && <>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">State (Secondary)</p>
                  <p className="font-medium text-gray-900">{caseData.state_1 || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">District (Secondary)</p>
                  <p className="font-medium text-gray-900">{caseData.district_1 || 'Not specified'}</p>
                </div>
              </>}
          </div>
        </CardContent>
      </Card>

      {/* Legal Reference */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="w-5 h-5 text-blue-600" />
            Legal Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Acts</p>
              {caseData.acts && caseData.acts.length > 0 ? <div className="flex flex-wrap gap-1">
                  {caseData.acts.map((act: string, index: number) => <Badge key={index} variant="outline" className="text-xs">
                      {act}
                    </Badge>)}
                </div> : <p className="text-gray-600 text-sm">No acts specified</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Sections</p>
              {caseData.sections && caseData.sections.length > 0 ? <div className="flex flex-wrap gap-1">
                  {caseData.sections.map((section: string, index: number) => <Badge key={index} variant="outline" className="text-xs">
                      {section}
                    </Badge>)}
                </div> : <p className="text-gray-600 text-sm">No sections specified</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
              <p className="font-medium text-gray-900">{caseData.category || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Sub Category</p>
              <p className="font-medium text-gray-900">{caseData.sub_category || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                {caseData.filing_number || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Registration Number</p>
              <p className="font-medium text-gray-900 font-mono text-sm">
                {caseData.registration_number || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">CNR Number</p>
              <p className="font-medium text-gray-900 font-mono text-sm">
                {caseData.cnr_number || 'Not assigned'}
              </p>
            </div>
            {caseData.case_number && <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Case Number</p>
                <p className="font-medium text-gray-900 font-mono text-sm">{caseData.case_number}</p>
              </div>}
            {caseData.docket_number && <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Docket Number</p>
                <p className="font-medium text-gray-900 font-mono text-sm">{caseData.docket_number}</p>
              </div>}
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

      {/* E-Courts Integration Status */}
      

      {caseData && <EditCaseDialog open={showEditDialog} onClose={() => setShowEditDialog(false)} caseId={caseId} caseData={caseData} />}
    </div>;
};