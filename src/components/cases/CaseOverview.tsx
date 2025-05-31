import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, FileText, Gavel, Clock, User, Building2, Hash, Calendar, MapPin } from 'lucide-react';
import { format, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { RecentActivity } from './RecentActivity';

interface CaseOverviewProps {
  caseData: any;
}

export const CaseOverview: React.FC<CaseOverviewProps> = ({ caseData }) => {
  const formatDurationSinceFiling = (filingDate: string | null) => {
    if (!filingDate) return 'Not filed yet';
    
    const filing = new Date(filingDate);
    const now = new Date();
    
    const years = differenceInYears(now, filing);
    const months = differenceInMonths(now, filing) % 12;
    const days = differenceInDays(now, filing) % 30;
    
    const parts = [];
    if (years > 0) parts.push(`${years} Year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} Month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Filed today';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'in_court':
        return 'bg-blue-500';
      case 'closed':
        return 'bg-gray-500';
      case 'on_hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Case Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge 
              variant={caseData?.status === 'open' ? 'default' : 'secondary'}
              className={`${getStatusColor(caseData?.status)} text-white`}
            >
              {caseData?.status?.replace('_', ' ').toUpperCase() || 'Unknown'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge 
              variant="outline"
              className={`${getPriorityColor(caseData?.priority)} border-current`}
            >
              {caseData?.priority?.toUpperCase() || 'MEDIUM'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Since Filing</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatDurationSinceFiling(caseData?.filing_date)}
            </div>
            {caseData?.filing_date && (
              <p className="text-xs text-muted-foreground">
                Filed: {format(new Date(caseData.filing_date), 'MMM d, yyyy')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Hearing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {caseData?.next_hearing_date 
                ? format(new Date(caseData.next_hearing_date), 'MMM d, yyyy')
                : 'Not scheduled'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {caseData?.next_hearing_date 
                ? `${differenceInDays(new Date(caseData.next_hearing_date), new Date())} days from now`
                : 'No upcoming hearing'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Case Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Case Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Case Title and Description */}
            <div>
              <h3 className="font-semibold text-lg mb-2">{caseData?.case_title}</h3>
              {caseData?.description && (
                <p className="text-gray-600 text-sm leading-relaxed">{caseData.description}</p>
              )}
            </div>

            {/* Case Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseData?.filing_number && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Filing Number</p>
                    <p className="font-medium">{caseData.filing_number}</p>
                  </div>
                </div>
              )}
              {caseData?.cnr_number && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">CNR Number</p>
                    <p className="font-medium">{caseData.cnr_number}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseData?.petitioner && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Petitioner</p>
                  <p className="font-medium">{caseData.petitioner}</p>
                  {caseData?.petitioner_advocate && (
                    <p className="text-xs text-gray-400">Advocate: {caseData.petitioner_advocate}</p>
                  )}
                </div>
              )}
              {caseData?.respondent && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Respondent</p>
                  <p className="font-medium">{caseData.respondent}</p>
                  {caseData?.respondent_advocate && (
                    <p className="text-xs text-gray-400">Advocate: {caseData.respondent_advocate}</p>
                  )}
                </div>
              )}
            </div>

            {/* Court Information */}
            {caseData?.court_name && (
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Court</p>
                  <p className="font-medium">{caseData.court_name}</p>
                  {caseData?.court_complex && (
                    <p className="text-xs text-gray-400">{caseData.court_complex}</p>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {(caseData?.state || caseData?.district) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">
                    {[caseData?.district, caseData?.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Acts and Sections */}
            {(caseData?.acts?.length > 0 || caseData?.sections?.length > 0) && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Legal References</p>
                <div className="space-y-2">
                  {caseData?.acts?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Acts:</p>
                      <div className="flex flex-wrap gap-1">
                        {caseData.acts.map((act: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {act}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {caseData?.sections?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Sections:</p>
                      <div className="flex flex-wrap gap-1">
                        {caseData.sections.map((section: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity caseId={caseData?.id} limit={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-green-500';
    case 'in_court':
      return 'bg-blue-500';
    case 'closed':
      return 'bg-gray-500';
    case 'on_hold':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-400';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};
