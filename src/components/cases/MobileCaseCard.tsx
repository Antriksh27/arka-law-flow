import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, Scale } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { getCaseStatusColor } from '@/lib/statusColors';

interface MobileCaseCardProps {
  case: any;
}

const getStatusColor = (status: string) => {
  const colors = getCaseStatusColor(status);
  return `${colors.bg} ${colors.text} ${colors.border}`;
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

export const MobileCaseCard: React.FC<MobileCaseCardProps> = ({ case: caseItem }) => {
  const getDisplayTitle = () => {
    if (caseItem.case_title) {
      return caseItem.case_title;
    }
    if (caseItem.petitioner && caseItem.respondent) {
      const cleanPetitioner = caseItem.petitioner.replace(/\s*Advocate[:\s].*/gi, '').trim();
      const cleanRespondent = caseItem.respondent.replace(/\s*Advocate[:\s].*/gi, '').trim();
      return `${cleanPetitioner} Vs ${cleanRespondent}`;
    }
    if (caseItem.reference_number) {
      return `Case ${caseItem.reference_number}`;
    }
    if (caseItem.registration_number) {
      return `Case ${caseItem.registration_number}`;
    }
    return 'Untitled Case';
  };

  return (
    <Link to={`/cases/${caseItem.id}`} className="block">
      <div className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all p-4">
        {/* Reference Number */}
        {caseItem.reference_number && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
              {caseItem.reference_number}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-base text-foreground mb-2 leading-tight line-clamp-2">
          {getDisplayTitle()}
        </h3>

        {/* Status Badges - Horizontal Row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={`${getStatusColor(caseItem.status)} rounded-full text-xs px-2.5 py-0.5 border`}>
            {caseItem.status?.replace('_', ' ').toUpperCase()}
          </Badge>
          {caseItem.stage && (
            <Badge variant={getStageBadgeVariant(caseItem.stage) as any} className="rounded-full px-2.5 py-0.5 text-xs">
              {caseItem.stage}
            </Badge>
          )}
        </div>

        {/* Key Info - Court and Next Hearing */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {caseItem.court_name && (
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{caseItem.court_name}</span>
            </div>
          )}
          {caseItem.next_hearing_date && (
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Next: {TimeUtils.formatDate(caseItem.next_hearing_date, 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Footer - Updated Date */}
        <div className="mt-3 pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Updated {TimeUtils.formatDate(caseItem.updated_at, 'MMM d')}
          </div>
        </div>
      </div>
    </Link>
  );
};
