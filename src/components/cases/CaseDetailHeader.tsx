
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Calendar, FileText, Plus, Upload, X } from 'lucide-react';
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
    return type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {caseData.title || 'Untitled Case'}
              </h1>
              <Badge className={`${getStatusColor(caseData.status)} rounded-full text-xs px-2 py-1`}>
                {caseData.status === 'in_court' ? 'In Court' : 
                 caseData.status === 'on_hold' ? 'On Hold' : 
                 caseData.status?.charAt(0).toUpperCase() + caseData.status?.slice(1)}
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs px-2 py-1">
                {formatCaseType(caseData.case_type)}
              </Badge>
            </div>
            <p className="text-gray-600 mb-4">
              {caseData.description || 'No description provided'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-900 text-slate-900 hover:bg-slate-50">
              <Edit className="w-4 h-4 mr-2" />
              Edit Case
            </Button>
            <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">
              <X className="w-4 h-4 mr-2" />
              Close Case
            </Button>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Hearing
            </Button>
          </div>
        </div>

        {/* Case Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-gray-400">👤</div>
              <p className="text-sm text-gray-500">Client</p>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-slate-100 text-xs">
                  {caseData.client_name ? caseData.client_name.split(' ').map((n: string) => n[0]).join('') : 'C'}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-gray-900">
                {caseData.client_name || 'No client assigned'}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-gray-400">👥</div>
              <p className="text-sm text-gray-500">Team</p>
            </div>
            <div className="flex items-center gap-1">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-slate-800 text-white text-xs">A</AvatarFallback>
              </Avatar>
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-orange-600 text-white text-xs">B</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0 rounded-full border border-dashed border-gray-300">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-gray-400">🏛️</div>
              <p className="text-sm text-gray-500">Filed Date</p>
            </div>
            <p className="font-medium text-gray-900">
              {caseData.filing_date ? format(new Date(caseData.filing_date), 'MMM d, yyyy') : 'Not set'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-gray-400">⚡</div>
              <p className="text-sm text-gray-500">Priority</p>
            </div>
            <Badge className={`${getPriorityColor(caseData.priority)} rounded-full text-xs px-2 py-1`}>
              {caseData.priority === 'high' ? 'High Priority' : 
               caseData.priority?.charAt(0).toUpperCase() + caseData.priority?.slice(1) + ' Priority'}
            </Badge>
          </div>
        </div>

        {/* Court and Hearing Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-gray-400">🏛️</div>
              <p className="text-sm text-gray-500">Court</p>
            </div>
            <p className="font-medium text-gray-900">
              {caseData.court || 'Not specified'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-gray-400">⏰</div>
              <p className="text-sm text-gray-500">Next Hearing</p>
            </div>
            <p className="font-medium text-gray-900">
              {caseData.next_hearing_date ? format(new Date(caseData.next_hearing_date), 'MMM d, yyyy') : 'Not scheduled'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-gray-400">📄</div>
              <p className="text-sm text-gray-500">Documents</p>
            </div>
            <p className="font-medium text-gray-900">
              {caseData.document_count || 0}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-gray-400">📅</div>
              <p className="text-sm text-gray-500">Hearings</p>
            </div>
            <p className="font-medium text-gray-900">
              {caseData.hearing_count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Sidebar would go here if needed */}
    </div>
  );
};
