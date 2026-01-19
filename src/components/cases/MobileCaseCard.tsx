import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, Scale, ChevronRight, Clock } from 'lucide-react';
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

  const isUrgent = caseItem.next_hearing_date && 
    new Date(caseItem.next_hearing_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Link to={`/cases/${caseItem.id}`} className="block">
      <div className="bg-card border border-border rounded-2xl shadow-sm active:scale-[0.98] transition-all duration-200 p-4">
        <div className="flex items-start gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Reference Number */}
            {caseItem.reference_number && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wide">
                  {caseItem.reference_number}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="font-semibold text-base text-foreground mb-2 leading-tight line-clamp-2">
              {getDisplayTitle()}
            </h3>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={`${getStatusColor(caseItem.status)} rounded-full text-[10px] px-2.5 py-0.5 border`}>
                {caseItem.status?.replace('_', ' ').toUpperCase()}
              </Badge>
              {caseItem.stage && (
                <Badge variant={getStageBadgeVariant(caseItem.stage) as any} className="rounded-full px-2.5 py-0.5 text-[10px]">
                  {caseItem.stage}
                </Badge>
              )}
            </div>

            {/* Key Info */}
            <div className="space-y-2">
              {caseItem.court_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="p-1 bg-muted rounded">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{caseItem.court_name}</span>
                </div>
              )}
              {caseItem.next_hearing_date && (
                <div className={`flex items-center gap-2 text-sm font-medium ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
                  <div className={`p-1 rounded ${isUrgent ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span>Next: {TimeUtils.formatDate(caseItem.next_hearing_date, 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Updated {TimeUtils.formatDate(caseItem.updated_at, 'MMM d')}</span>
          </div>
          {caseItem.client_name && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {caseItem.client_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
