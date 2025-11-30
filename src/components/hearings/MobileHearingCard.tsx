import React from 'react';
import { format, parseISO } from 'date-fns';
import { Badge } from '../ui/badge';
import { Scale, MapPin, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileHearingCardProps {
  hearing: any;
  onClick: () => void;
}

export const MobileHearingCard: React.FC<MobileHearingCardProps> = ({
  hearing,
  onClick,
}) => {
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      return format(parseISO(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'border-l-blue-500';
      case 'completed':
        return 'border-l-green-500';
      case 'postponed':
        return 'border-l-yellow-500';
      case 'cancelled':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return <Badge variant="default" className="text-xs">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-600 text-white text-xs">Completed</Badge>;
      case 'postponed':
        return <Badge className="bg-yellow-600 text-white text-xs">Postponed</Badge>;
      case 'cancelled':
        return <Badge variant="error" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status || 'Pending'}</Badge>;
    }
  };

  const isPast = hearing.hearing_date && new Date(hearing.hearing_date) < new Date();

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border-l-4 shadow-sm p-4 active:scale-[0.98] transition-all cursor-pointer",
        getStatusColor(hearing.status),
        isPast && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {hearing.cases?.case_title || 'Untitled Case'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {hearing.cases?.registration_number || hearing.cases?.case_number || 'No case number'}
            </p>
          </div>
        </div>
        {getStatusBadge(hearing.status)}
      </div>

      <div className="space-y-2">
        {hearing.hearing_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatTime(hearing.hearing_time)}</span>
          </div>
        )}
        
        {hearing.court_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{hearing.court_name}</span>
          </div>
        )}

        {hearing.judge && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="truncate">{hearing.judge}</span>
          </div>
        )}

        {hearing.purpose_of_hearing && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 mt-2">
            {hearing.purpose_of_hearing}
          </div>
        )}
      </div>
    </div>
  );
};
