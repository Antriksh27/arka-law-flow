import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Scale, ChevronRight, User } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { getCaseStatusColor } from '@/lib/statusColors';

interface MobileCaseCardProps {
  case: any;
}

const getStatusColor = (status: string) => {
  const colors = getCaseStatusColor(status);
  return `${colors.bg} ${colors.text}`;
};

const getInitials = (title: string) => {
  if (!title) return '?';
  // Get first letter of first two words
  return title
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
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

  const displayTitle = getDisplayTitle();

  const isUrgent = caseItem.next_hearing_date && 
    new Date(caseItem.next_hearing_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Link to={`/cases/${caseItem.id}`} className="block">
      <div className="bg-card rounded-2xl border border-border p-4 active:scale-[0.98] transition-all duration-200 shadow-sm">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {getInitials(displayTitle)}
            </AvatarFallback>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Reference Number */}
                {caseItem.reference_number && (
                  <p className="text-xs text-muted-foreground mb-0.5 truncate">
                    {caseItem.reference_number}
                  </p>
                )}
                {/* Title */}
                <p className="font-medium text-foreground text-base line-clamp-2 leading-tight">
                  {displayTitle}
                </p>
                {/* Court */}
                {caseItem.court_name && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Scale className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground truncate">
                      {caseItem.court_name}
                    </p>
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
            
            {/* Status badge */}
            <div className="mt-2">
              <Badge className={`${getStatusColor(caseItem.status)} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                {caseItem.status?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Footer with hearing date and client */}
        {(caseItem.next_hearing_date || caseItem.client_name) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            {caseItem.next_hearing_date && (
              <div className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-xl ${isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {TimeUtils.formatDate(caseItem.next_hearing_date, 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            {caseItem.client_name && (
              <div className="flex items-center gap-2 flex-1 py-2 px-3 rounded-xl bg-muted text-muted-foreground">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {caseItem.client_name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
