import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import TimeUtils from '@/lib/timeUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface HearingsTabProps {
  hearings: any[];
  caseData: any;
}

export const HearingsTab: React.FC<HearingsTabProps> = ({ hearings, caseData }) => {
  const [pastOpen, setPastOpen] = React.useState(false);

  const now = new Date();
  const upcomingHearings = hearings?.filter(h => h.hearing_date && new Date(h.hearing_date) >= now) || [];
  const pastHearings = hearings?.filter(h => h.hearing_date && new Date(h.hearing_date) < now) || [];

  // Next hearing from case data
  const nextHearingDate = caseData?.next_hearing_date ? new Date(caseData.next_hearing_date) : null;

  return (
    <div className="space-y-4">
      {/* Next Hearing Card */}
      {nextHearingDate && nextHearingDate >= now && (
        <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary rounded-full p-2">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base text-foreground">Next Hearing</h3>
                  <Badge className="bg-orange-500">Upcoming</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {TimeUtils.formatDate(nextHearingDate, 'EEEE, dd MMM yyyy')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {Math.ceil((nextHearingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days from now
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Hearings */}
      {upcomingHearings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Upcoming Hearings</h3>
          {upcomingHearings.map((hearing, index) => (
            <Card key={index} className="bg-card border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {TimeUtils.formatDate(new Date(hearing.hearing_date), 'dd MMM yyyy')}
                    </p>
                    {hearing.business_on_date && (
                      <p className="text-xs text-muted-foreground mt-1">{hearing.business_on_date}</p>
                    )}
                    {hearing.purpose && (
                      <p className="text-xs text-muted-foreground mt-1">{hearing.purpose}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">Scheduled</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Past Hearings - Collapsible */}
      {pastHearings.length > 0 && (
        <Collapsible open={pastOpen} onOpenChange={setPastOpen}>
          <Card className="bg-card border-border shadow-sm">
            <CollapsibleTrigger asChild>
              <div className="cursor-pointer hover:bg-accent/50 transition-colors p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">Past Hearings</h3>
                    <Badge variant="outline" className="text-xs">{pastHearings.length}</Badge>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${pastOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-2">
                {pastHearings.map((hearing, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                    <div className="bg-muted rounded-full p-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {TimeUtils.formatDate(new Date(hearing.hearing_date), 'dd MMM yyyy')}
                      </p>
                      {hearing.business_on_date && (
                        <p className="text-xs text-muted-foreground mt-1">{hearing.business_on_date}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">Completed</Badge>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Empty State */}
      {upcomingHearings.length === 0 && pastHearings.length === 0 && !nextHearingDate && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm">No hearings scheduled</p>
        </div>
      )}
    </div>
  );
};