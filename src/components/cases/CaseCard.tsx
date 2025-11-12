
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Users, MoreHorizontal, Scale } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';

interface CaseCardProps {
  case: any;
}

const getDisplayStatus = (caseItem: any) => {
  // If linked to Legalkart (has CNR and has been fetched), show actual status mapped to in_court/disposed
  const isLinkedToLegalkart = caseItem.cnr_number && caseItem.last_fetched_at;
  const mapToLegalkartStatus = (text?: string | null) => {
    const s = (text || '').toLowerCase();
    if (!s) return 'in_court';
    if (
      s.includes('disposed') || s.includes('dismiss') || s.includes('withdraw') ||
      s.includes('decid') || s.includes('complete') || s.includes('settled') || s.includes('close')
    ) {
      return 'disposed';
    }
    return 'in_court';
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
      case 'in_court':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'disposed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStageBadgeVariant = (stage: string | undefined) => {
    if (!stage) return "default";
    const stageLower = stage.toLowerCase();
    
    if (stageLower.includes('disposed') || stageLower.includes('decided') || stageLower.includes('completed')) {
      return "disposed";
    }
    if (stageLower.includes('hearing') || stageLower.includes('listed') || stageLower.includes('returnable')) {
      return "active";
    }
    if (stageLower.includes('pending') || stageLower.includes('admission') || stageLower.includes('adjourned')) {
      return "warning";
    }
    return "default";
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
    <Link to={`/cases/${caseItem.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all p-5">
        {/* Title Section */}
        <div className="mb-3">
          <h3 className="font-semibold text-base text-gray-900 mb-1.5 leading-tight line-clamp-2">
            {getDisplayTitle()}
          </h3>
          {caseItem.court && (
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              {caseItem.court}
            </p>
          )}
        </div>

        {/* Next Hearing Badge */}
        {caseItem.next_hearing_date && (
          <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
            <Calendar className="w-3.5 h-3.5" />
            Next: {TimeUtils.formatDate(caseItem.next_hearing_date, 'MMM dd, yyyy')}
          </div>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={`${getStatusColor(getDisplayStatus(caseItem))} rounded-full text-xs px-3 py-1`}>
            {getDisplayStatus(caseItem)?.replace('_', ' ')}
          </Badge>
          {caseItem.stage && (
            <Badge variant={getStageBadgeVariant(caseItem.stage) as any} className="rounded-full px-3 py-1 text-xs">
              {caseItem.stage}
            </Badge>
          )}
        </div>

        {/* Bottom Section */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>Docs</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {TimeUtils.formatDate(caseItem.updated_at, 'MMM d')}
          </div>
        </div>
      </div>
    </Link>
  );
};
