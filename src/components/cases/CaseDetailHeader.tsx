
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Calendar, FileText, Users, Clock, Plus, Ban } from 'lucide-react';
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
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {caseData.title}
            </h1>
            <p className="text-gray-600 mb-4">
              {caseData.description || 'No description provided'}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {caseData.tags?.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Case
            </Button>
            <Button variant="outline" size="sm">
              <Ban className="w-4 h-4 mr-2" />
              Close Case
            </Button>
          </div>
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
              {caseData.clients?.full_name || 'No client assigned'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>0 Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>0 Hearings</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>0 Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Updated {format(new Date(caseData.updated_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              Add Hearing
            </Button>
            <Button size="sm" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Button size="sm" variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {caseData.profiles?.full_name && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">Created by</span>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-100 text-sm">
                {caseData.profiles.full_name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{caseData.profiles.full_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
