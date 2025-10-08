import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Download, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';

interface CaseHeaderProps {
  caseData: any;
  onEdit?: () => void;
  onFetchUpdates?: () => void;
  onExport?: () => void;
  onClose?: () => void;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({
  caseData,
  onEdit,
  onFetchUpdates,
  onExport,
  onClose
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_court': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'on_hold': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
      {/* Title and Badges */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{caseData.title}</h1>
            <Badge className={`${getStatusColor(caseData.status)} rounded-full`}>
              {caseData.status?.replace('_', ' ')}
            </Badge>
            <Badge className={`${getPriorityColor(caseData.priority)} rounded-full`}>
              {caseData.priority} Priority
            </Badge>
          </div>
          
          {/* Key Info Row */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {caseData.client?.full_name && (
              <div>
                <span className="font-medium">Client:</span> {caseData.client.full_name}
              </div>
            )}
            {caseData.court_name && (
              <div>
                <span className="font-medium">Court:</span> {caseData.court_name}
              </div>
            )}
            {caseData.next_hearing_date && (
              <div>
                <span className="font-medium">Next Hearing:</span> {format(new Date(caseData.next_hearing_date), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          {/* Assigned Team */}
          {caseData.assigned_users && caseData.assigned_users.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Team:</span>
              <div className="flex -space-x-2">
                {caseData.assigned_users.slice(0, 3).map((userId: string, index: number) => (
                  <Avatar key={index} className="w-8 h-8 border-2 border-white">
                    <AvatarFallback className="text-xs">
                      {String(index + 1)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {caseData.assigned_users.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-gray-600">+{caseData.assigned_users.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {onFetchUpdates && caseData.cnr_number && (
            <Button variant="outline" size="sm" onClick={onFetchUpdates}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Fetch Updates
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {onClose && (
            <Button variant="destructive" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close Case
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
