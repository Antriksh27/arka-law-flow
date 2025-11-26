import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface ListingDate {
  id: string;
  cl_date?: string | null;
  stage?: string | null;
  purpose?: string | null;
  judges?: string | string[] | null;
  remarks?: string | null;
  listed_status?: string | null;
}

interface SCListingHistoryTimelineProps {
  data: ListingDate[];
}

export function SCListingHistoryTimeline({ data }: SCListingHistoryTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hearing history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((hearing, index) => (
        <div key={hearing.id} className="relative pl-8 pb-8 border-l-2 border-border last:border-l-0">
          <div className="absolute left-0 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Calendar className="h-3 w-3 text-primary-foreground" />
          </div>
          
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-base">
                  {hearing.cl_date ? format(new Date(hearing.cl_date), 'dd MMM yyyy') : 'Date not available'}
                </p>
                {hearing.stage && (
                  <p className="text-sm text-muted-foreground mt-1">{hearing.stage}</p>
                )}
              </div>
              {hearing.listed_status && (
                <Badge variant={hearing.listed_status === 'LISTED' ? 'default' : 'outline'}>
                  {hearing.listed_status}
                </Badge>
              )}
            </div>
            
            {hearing.purpose && (
              <p className="text-sm mb-2">
                <span className="font-medium">Purpose:</span> {hearing.purpose}
              </p>
            )}
            
            {hearing.judges && (
              <p className="text-sm mb-2 text-muted-foreground">
                <span className="font-medium">Judges:</span> {Array.isArray(hearing.judges) ? hearing.judges.join(', ') : hearing.judges}
              </p>
            )}
            
            {hearing.remarks && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Remarks:</span> {hearing.remarks}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}