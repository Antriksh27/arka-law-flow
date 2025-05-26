import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, FileText, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface CaseCardProps {
  case: any;
}

export const CaseCard: React.FC<CaseCardProps> = ({ case: caseItem }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_court':
        return 'bg-slate-900 text-white border-slate-800';
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
        return 'bg-slate-900 text-white border-slate-800';
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
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:scale-[1.01]"
      onClick={() => navigate(`/cases/${caseItem.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {caseItem.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Client: {caseItem.client_name || 'No client assigned'}
          </p>
        </div>
        <Badge className={`${getStatusColor(caseItem.status)} rounded-full text-xs`}>
          {caseItem.status?.replace('_', ' ')}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Type:</span>
          <span className="text-gray-900">{formatCaseType(caseItem.case_type)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Priority:</span>
          <Badge className={`${getPriorityColor(caseItem.priority)} rounded-full text-xs`}>
            {caseItem.priority}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{caseItem.document_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{caseItem.hearing_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{caseItem.task_count || 0}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Updated {format(new Date(caseItem.updated_at), 'MMM d')}</span>
          </div>
          
          {caseItem.created_by_name && (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-gray-100">
                  {caseItem.created_by_name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
