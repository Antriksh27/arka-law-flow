import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Calendar, FileText, Users, TrendingUp, Clock, AlertCircle, CheckCircle, User } from 'lucide-react';
import { RecentActivity } from './RecentActivity';

export interface CaseOverviewProps {
  caseId: string;
}

export const CaseOverview: React.FC<CaseOverviewProps> = ({ caseId }) => {
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case-overview', caseId],
    queryFn: async () => {
      const { data: caseResult, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();
      
      if (caseError) throw caseError;
      
      // Get client data separately
      let clientData = null;
      if (caseResult.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('full_name')
          .eq('id', caseResult.client_id)
          .single();
        
        if (!clientError && client) {
          clientData = client;
        }
      }
      
      // Get creator data separately
      let creatorData = null;
      if (caseResult.created_by) {
        const { data: creator, error: creatorError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', caseResult.created_by)
          .single();
        
        if (!creatorError && creator) {
          creatorData = creator;
        }
      }
      
      return {
        ...caseResult,
        client: clientData,
        creator: creatorData
      };
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Case data not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  // Calculate days since filing using filing_date and format as Years, Months, Days
  const calculateDaysSinceFiling = () => {
    if (!caseData.filing_date) return 'Not filed';
    
    const filingDate = new Date(caseData.filing_date);
    const today = new Date();
    
    if (filingDate > today) return 'Future date';
    
    let years = today.getFullYear() - filingDate.getFullYear();
    let months = today.getMonth() - filingDate.getMonth();
    let days = today.getDate() - filingDate.getDate();
    
    // Adjust for negative days
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Format the result
    const parts = [];
    if (years > 0) parts.push(`${years} Year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} Month${months !== 1 ? 's' : ''}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      {/* AI Case Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="w-5 h-5" />
            AI Case Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-blue-700">
              This is an AI-generated summary of the case based on available information. 
              The case "{caseData.title}" is currently in {caseData.status} status and was filed on{' '}
              {caseData.filing_date ? new Date(caseData.filing_date).toLocaleDateString() : 'Unknown date'}.
            </p>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(caseData.status)}>
                {caseData.status || 'Unknown'}
              </Badge>
              <span className="text-sm text-blue-600">
                Last updated: {caseData.updated_at ? new Date(caseData.updated_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Status & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Case Status</p>
                <p className="text-lg font-semibold text-gray-900">{caseData.status || 'Unknown'}</p>
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
                <p className="text-sm text-gray-500">Days Since Filing</p>
                <p className="text-lg font-semibold text-gray-900">
                  {calculateDaysSinceFiling()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <p className="text-lg font-semibold text-gray-900">{caseData.priority || 'Medium'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Information */}
      <Card>
        <CardHeader>
          <CardTitle>Case Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Case Title</p>
                <p className="font-medium">{caseData.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{caseData.client?.full_name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Case Type</p>
                <p className="font-medium">{caseData.case_type || 'Not specified'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{caseData.description || 'No description available'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{caseData.creator?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created Date</p>
                <p className="font-medium">
                  {caseData.created_at ? new Date(caseData.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activity</span>
            <Button variant="outline" size="sm">View All</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity caseId={caseId} />
        </CardContent>
      </Card>
    </div>
  );
};
