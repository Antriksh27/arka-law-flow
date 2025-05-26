
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Calendar, FileText, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface CaseDetailHeaderProps {
  case: any;
}

export const CaseDetailHeader: React.FC<CaseDetailHeaderProps> = ({ case: caseData }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatCaseType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {caseData.title}
            </h1>
            <p className="text-gray-600">
              {caseData.description || 'No description provided'}
            </p>
          </div>
          
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Case
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <Badge className={`${getStatusColor(caseData.status)} rounded-full`}>
              {caseData.status?.replace('_', ' ')}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Case Type</p>
            <p className="font-medium text-gray-900">
              {formatCaseType(caseData.case_type)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Priority</p>
            <Badge className={`${getPriorityColor(caseData.priority)} rounded-full`}>
              {caseData.priority}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Client</p>
            <p className="font-medium text-gray-900">
              {caseData.client_name || 'No client assigned'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{caseData.document_count || 0} Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{caseData.hearing_count || 0} Hearings</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{caseData.task_count || 0} Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Updated {format(new Date(caseData.updated_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {caseData.created_by_name && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Created by</span>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-100 text-sm">
                  {caseData.created_by_name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{caseData.created_by_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
