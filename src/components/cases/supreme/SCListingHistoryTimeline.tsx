import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

interface SCListingHistoryTimelineProps {
  caseId: string;
  data?: any[];
}

export const SCListingHistoryTimeline = ({ caseId, data: propData }: SCListingHistoryTimelineProps) => {
  const { data: dbData = [], isLoading } = useQuery({
    queryKey: ['sc-listing-dates', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_listing_dates' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('cl_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId && !propData
  });
  
  const listings = propData || dbData;
  
  if (isLoading && !propData) {
    return <div className="text-muted-foreground">Loading listing history...</div>;
  }
  
  if (listings.length === 0) {
    return <div className="text-muted-foreground">No listing history available</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {listings.map((listing, idx) => (
          <div key={listing.id || idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
              {idx < listings.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
            </div>
            <Card className="flex-1 p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-lg">
                  {listing.cl_date || listing['CL Date'] 
                    ? format(parseISO(listing.cl_date || listing['CL Date']), 'dd MMM yyyy')
                    : 'No Date'}
                </div>
                <Badge>{listing.misc_or_regular || listing['Misc./Regular'] || 'N/A'}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {listing.stage || listing['Stage'] || 'N/A'}
              </div>
              <div className="text-sm">
                <strong>Purpose:</strong> {listing.purpose || listing['Purpose'] || 'N/A'}
              </div>
              {(listing.judges || listing['Judges']) && (
                <div className="text-sm mt-2">
                  <strong>Bench:</strong> {Array.isArray(listing.judges || listing['Judges'])
                    ? (listing.judges || listing['Judges']).join(', ')
                    : listing.judges || listing['Judges']}
                </div>
              )}
              {(listing.remarks || listing['Remarks']) && (
                <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                  {listing.remarks || listing['Remarks']}
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
