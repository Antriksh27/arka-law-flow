
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertCircle, Calendar, FileText, Users, Gavel } from 'lucide-react';

interface CaseOverviewProps {
  caseId: string;
}

export const CaseOverview: React.FC<CaseOverviewProps> = ({ caseId }) => {
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case-overview', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          clients(full_name),
          profiles(full_name)
        `)
        .eq('id', caseId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="animate-pulse p-6">Loading overview...</div>;
  }

  if (!caseData) {
    return <div className="text-center py-8">Case not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-700';
      case 'on_hold':
        return 'bg-orange-100 text-orange-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Summary Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="w-5 h-5" />
            AI Case Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 leading-relaxed">
            This is a {caseData.case_type?.replace('_', ' ')} case with {caseData.priority} priority. 
            The case is currently <Badge className={getStatusColor(caseData.status)}>{caseData.status}</Badge> and 
            {caseData.next_hearing_date 
              ? ` has a hearing scheduled for ${new Date(caseData.next_hearing_date).toLocaleDateString()}.`
              : ' has no upcoming hearings scheduled.'
            }
            {caseData.description && ` Case involves: ${caseData.description}`}
          </p>
        </CardContent>
      </Card>

      {/* Case Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <Badge className={getStatusColor(caseData.status)}>
                  {caseData.status?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Hearing</p>
                <p className="font-medium">
                  {caseData.next_hearing_date 
                    ? new Date(caseData.next_hearing_date).toLocaleDateString()
                    : 'Not scheduled'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Gavel className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Case Type</p>
                <p className="font-medium capitalize">
                  {caseData.case_type?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Information */}
      <Card>
        <CardHeader>
          <CardTitle>Key Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{caseData.clients?.full_name || 'No client assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Case Number</p>
                <p className="font-medium">{caseData.case_number || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Court</p>
                <p className="font-medium">{caseData.court || 'Not specified'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Filing Date</p>
                <p className="font-medium">
                  {caseData.filing_date 
                    ? new Date(caseData.filing_date).toLocaleDateString()
                    : 'Not specified'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <Badge variant="outline" className="capitalize">
                  {caseData.priority} Priority
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{caseData.profiles?.full_name || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Description */}
      {caseData.description && (
        <Card>
          <CardHeader>
            <CardTitle>Case Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{caseData.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
