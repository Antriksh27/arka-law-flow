import { Scale, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeUtils } from '@/lib/timeUtils';
import { differenceInDays, differenceInHours } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Hearing {
  id: string;
  hearing_date: string;
  court_name: string;
  case_title: string;
  assigned_lawyer?: string;
}

interface UpcomingHearingsCardProps {
  hearings: Hearing[];
  isLoading: boolean;
}

export const UpcomingHearingsCard = ({ hearings, isLoading }: UpcomingHearingsCardProps) => {
  const navigate = useNavigate();

  const getUrgencyColor = (hearingDate: string) => {
    const now = new Date();
    const hearing = new Date(hearingDate);
    const hoursUntil = differenceInHours(hearing, now);
    const daysUntil = differenceInDays(hearing, now);

    if (hoursUntil <= 24) return { bg: 'bg-red-100', text: 'text-red-800', label: 'in ' + hoursUntil + 'h' };
    if (daysUntil <= 3) return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'in ' + daysUntil + 'd' };
    if (daysUntil <= 7) return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'in ' + daysUntil + 'd' };
    return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'in ' + daysUntil + 'd' };
  };

  return (
    <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Upcoming Hearings
          </CardTitle>
          <Button variant="link" size="sm" className="text-primary" onClick={() => navigate('/hearings')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : hearings.length === 0 ? (
          <div className="text-center py-8">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No upcoming hearings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hearings.slice(0, 5).map((hearing) => {
              const urgency = getUrgencyColor(hearing.hearing_date);
              return (
                <div key={hearing.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm flex-1">{hearing.case_title}</h4>
                    <Badge className={`${urgency.bg} ${urgency.text}`}>
                      {urgency.label}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {TimeUtils.formatDateTime(hearing.hearing_date, 'MMM dd, yyyy - h:mm a')}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="w-3 h-3" />
                      {hearing.court_name}
                    </div>
                    {hearing.assigned_lawyer && (
                      <div className="text-xs text-slate-500">
                        Assigned to: {hearing.assigned_lawyer}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
