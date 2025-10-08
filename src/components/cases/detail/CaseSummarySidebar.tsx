import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Scale, User, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface CaseSummarySidebarProps {
  caseData: any;
  legalkartData: any;
}

export const CaseSummarySidebar: React.FC<CaseSummarySidebarProps> = ({
  caseData,
  legalkartData
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-700',
      in_court: 'bg-purple-100 text-purple-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const courtName = legalkartData?.court_name || caseData?.court_name || caseData?.court || 'Not specified';
  const caseNumber = legalkartData?.case_number || caseData?.case_number || caseData?.registration_number || 'Not assigned';
  const stage = legalkartData?.stage || caseData?.stage || 'Not specified';
  const lastUpdated = caseData?.updated_at || caseData?.created_at;

  return (
    <Card className="p-5 space-y-4 sticky top-6">
      {/* Status Badge */}
      <div>
        <Badge className={`${getStatusColor(caseData?.status)} rounded-full`}>
          {caseData?.status?.replace('_', ' ') || 'Unknown'}
        </Badge>
      </div>

      {/* Case Title */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Case Title</h3>
        <p className="text-sm text-gray-600">
          {caseData?.vs || caseData?.title || 'Untitled Case'}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        {/* Case Number */}
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Case Number</p>
            <p className="text-sm font-medium text-gray-900 truncate">{caseNumber}</p>
          </div>
        </div>

        {/* Court */}
        <div className="flex items-start gap-2">
          <Scale className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Court Name</p>
            <p className="text-sm font-medium text-gray-900">{courtName}</p>
          </div>
        </div>

        {/* Stage */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Stage</p>
            <p className="text-sm font-medium text-gray-900">{stage}</p>
          </div>
        </div>

        {/* Next Hearing */}
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Next Hearing</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(legalkartData?.next_hearing_date || caseData?.next_hearing_date)}
            </p>
          </div>
        </div>

        {/* Client */}
        {caseData?.clients && (
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Client</p>
              <p className="text-sm font-medium text-gray-900">{caseData.clients.full_name}</p>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(lastUpdated)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
