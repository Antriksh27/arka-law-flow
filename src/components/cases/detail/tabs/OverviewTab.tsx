import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Calendar, TrendingUp, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface OverviewTabProps {
  caseData: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ caseData }) => {
  const calculateDaysSinceFiling = () => {
    if (!caseData.filing_date) return 'Not filed';
    
    const filingDate = new Date(caseData.filing_date);
    const today = new Date();
    
    if (filingDate > today) return 'Future date';
    
    const years = today.getFullYear() - filingDate.getFullYear();
    const months = today.getMonth() - filingDate.getMonth();
    const days = Math.floor((today.getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}, ${days % 30} day${(days % 30) !== 1 ? 's' : ''}`;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Brain className="w-5 h-5" />
            AI Case Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-foreground">
            This {caseData.case_type?.replace('_', ' ')} case "{caseData.title}" is currently <strong>{caseData.status?.replace('_', ' ')}</strong>.
            {caseData.filing_date && ` Filed on ${format(new Date(caseData.filing_date), 'MMMM d, yyyy')}.`}
            {caseData.next_hearing_date && ` Next hearing scheduled for ${format(new Date(caseData.next_hearing_date), 'MMMM d, yyyy')}.`}
          </p>
          {caseData.description && (
            <p className="text-sm text-muted-foreground italic">{caseData.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold capitalize">{caseData.status?.replace('_', ' ')}</p>
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
                <p className="text-sm text-muted-foreground">Days Active</p>
                <p className="text-lg font-semibold">{calculateDaysSinceFiling()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p className="text-lg font-semibold capitalize">{caseData.priority}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Case Type</p>
                <p className="text-lg font-semibold capitalize">{caseData.case_type?.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Dates Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Important Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {caseData.filing_date && (
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">Filing Date</div>
                <div className="flex-1 h-px bg-border"></div>
                <div className="text-sm font-medium">{format(new Date(caseData.filing_date), 'MMM d, yyyy')}</div>
              </div>
            )}
            {caseData.registration_date && (
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">Registration</div>
                <div className="flex-1 h-px bg-border"></div>
                <div className="text-sm font-medium">{format(new Date(caseData.registration_date), 'MMM d, yyyy')}</div>
              </div>
            )}
            {caseData.first_hearing_date && (
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">First Hearing</div>
                <div className="flex-1 h-px bg-border"></div>
                <div className="text-sm font-medium">{format(new Date(caseData.first_hearing_date), 'MMM d, yyyy')}</div>
              </div>
            )}
            {caseData.next_hearing_date && (
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">Next Hearing</div>
                <div className="flex-1 h-px bg-border"></div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {format(new Date(caseData.next_hearing_date), 'MMM d, yyyy')}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Case Information */}
      <Card>
        <CardHeader>
          <CardTitle>Case Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {caseData.case_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Case Number</p>
                  <p className="font-medium">{caseData.case_number}</p>
                </div>
              )}
              {caseData.cnr_number && (
                <div>
                  <p className="text-sm text-muted-foreground">CNR Number</p>
                  <p className="font-medium">{caseData.cnr_number}</p>
                </div>
              )}
              {caseData.filing_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Filing Number</p>
                  <p className="font-medium">{caseData.filing_number}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {caseData.court_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Court</p>
                  <p className="font-medium">{caseData.court_name}</p>
                </div>
              )}
              {caseData.client?.full_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{caseData.client.full_name}</p>
                </div>
              )}
              {caseData.created_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
