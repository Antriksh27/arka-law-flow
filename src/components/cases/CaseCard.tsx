
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Users, MoreHorizontal } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';

interface CaseCardProps {
  case: any;
}

const getDisplayStatus = (caseItem: any) => {
  // If linked to Legalkart (has CNR and has been fetched), show actual status mapped to pending/disposed
  const isLinkedToLegalkart = caseItem.cnr_number && caseItem.last_fetched_at;
  const mapToLegalkartStatus = (text?: string | null) => {
    const s = (text || '').toLowerCase();
    if (!s) return 'pending';
    if (
      s.includes('disposed') || s.includes('dismiss') || s.includes('withdraw') ||
      s.includes('decid') || s.includes('complete') || s.includes('settled') || s.includes('close')
    ) {
      return 'disposed';
    }
    return 'pending';
  };

  if (isLinkedToLegalkart) {
    return mapToLegalkartStatus(caseItem.status);
  }
  // Otherwise, show "open"
  return 'open';
};

export const CaseCard: React.FC<CaseCardProps> = ({ case: caseItem }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'disposed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-200';
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

  // Generate proper case title display
  const getDisplayTitle = () => {
    // Prioritize the title field (actual Case Title)
    if (caseItem.title) {
      return caseItem.title;
    }
    // Fallback: generate from petitioner/respondent if title is missing
    if (caseItem.petitioner && caseItem.respondent) {
      const cleanPetitioner = caseItem.petitioner.replace(/\s*Advocate[:\s].*/gi, '').trim();
      const cleanRespondent = caseItem.respondent.replace(/\s*Advocate[:\s].*/gi, '').trim();
      return `${cleanPetitioner} Vs ${cleanRespondent}`;
    }
    return 'Untitled Case';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link to={`/cases/${caseItem.id}`}>
            <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer mb-2">
              {getDisplayTitle()}
            </h3>
          </Link>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {caseItem.description || 'No description provided'}
          </p>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className={`${getStatusColor(getDisplayStatus(caseItem))} rounded-full text-xs`}>
          {getDisplayStatus(caseItem)?.replace('_', ' ')}
        </Badge>
        <Badge className={`${getPriorityColor(caseItem.priority)} rounded-full text-xs`}>
          {caseItem.priority} priority
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>0</span>
          </div>
        </div>
        <span className="text-xs">
          {TimeUtils.formatDate(caseItem.updated_at, 'MMM d')}
        </span>
      </div>
    </div>
  );
};
