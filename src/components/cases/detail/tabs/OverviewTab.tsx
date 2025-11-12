import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, Scale, User } from 'lucide-react';
import { formatDateDisplay, formatPartyName, formatAdvocateName } from '@/lib/caseDataFormatter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import TimeUtils from '@/lib/timeUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface OverviewTabProps {
  caseData: any;
  legalkartData: any;
  petitioners: any[];
  respondents: any[];
  hearings: any[];
  assignedLawyers: any[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  caseData,
  legalkartData,
  petitioners,
  respondents,
  hearings,
  assignedLawyers,
}) => {
  const isMobile = useIsMobile();
  const [caseInfoOpen, setCaseInfoOpen] = React.useState(true);
  const [partiesOpen, setPartiesOpen] = React.useState(true);
  const [timelineOpen, setTimelineOpen] = React.useState(false);
  const [lawyersOpen, setLawyersOpen] = React.useState(false);

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return formatDateDisplay(date);
  };

  // Timeline events
  const timelineEvents = [];
  if (caseData?.created_at) {
    timelineEvents.push({
      date: new Date(caseData.created_at),
      title: 'Case Created',
      icon: FileText,
    });
  }
  if (caseData?.filing_date) {
    timelineEvents.push({
      date: new Date(caseData.filing_date),
      title: 'Case Filed',
      icon: FileText,
    });
  }
  if (hearings && hearings.length > 0) {
    hearings.slice(0, 3).forEach((hearing) => {
      if (hearing.hearing_date) {
        timelineEvents.push({
          date: new Date(hearing.hearing_date),
          title: 'Hearing',
          icon: Calendar,
        });
      }
    });
  }
  timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Case Information */}
      <Collapsible open={caseInfoOpen} onOpenChange={setCaseInfoOpen}>
        <Card className="bg-card border-border shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Case Information</CardTitle>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${caseInfoOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              {[
                { label: 'Filing Number', value: legalkartData?.filing_number || caseData?.filing_number },
                { label: 'Filing Date', value: formatDate(legalkartData?.filing_date || caseData?.filing_date) },
                { label: 'CNR Number', value: legalkartData?.cnr_number || caseData?.cnr_number },
                { label: 'Case Type', value: legalkartData?.case_type || caseData?.case_type },
                { label: 'Stage', value: legalkartData?.stage_of_case || caseData?.stage },
                { label: 'Court', value: caseData?.court_name },
                { label: 'Judge', value: legalkartData?.court_number_and_judge },
              ]
                .filter(item => item.value)
                .map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-right max-w-[60%]">{item.value}</span>
                  </div>
                ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Parties */}
      <Collapsible open={partiesOpen} onOpenChange={setPartiesOpen}>
        <Card className="bg-card border-border shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Parties & Advocates</CardTitle>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${partiesOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Petitioners */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Petitioners</h4>
                {petitioners && petitioners.length > 0 ? (
                  <div className="space-y-2">
                    {petitioners.map((petitioner, index) => (
                      <div key={index} className="border-l-2 border-blue-500 pl-3 py-1">
                        <p className="text-sm font-medium text-foreground">
                          {index + 1}. {formatPartyName(petitioner.petitioner_name || petitioner.name)}
                        </p>
                        {petitioner.advocate_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Advocate: {formatAdvocateName(petitioner.advocate_name)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No petitioners listed</p>
                )}
              </div>

              {/* Respondents */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Respondents</h4>
                {respondents && respondents.length > 0 ? (
                  <div className="space-y-2">
                    {respondents.map((respondent, index) => (
                      <div key={index} className="border-l-2 border-red-500 pl-3 py-1">
                        <p className="text-sm font-medium text-foreground">
                          {index + 1}. {formatPartyName(respondent.respondent_name || respondent.name)}
                        </p>
                        {respondent.advocate_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Advocate: {formatAdvocateName(respondent.advocate_name)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No respondents listed</p>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Timeline */}
      <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
        <Card className="bg-card border-border shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Recent Timeline</CardTitle>
                  <Badge variant="outline" className="text-xs">{timelineEvents.length}</Badge>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${timelineOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {timelineEvents.length > 0 ? (
                <div className="space-y-3">
                  {timelineEvents.map((event, index) => {
                    const IconComponent = event.icon;
                    return (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {TimeUtils.formatDate(event.date, 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No timeline events</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Assigned Lawyers */}
      <Collapsible open={lawyersOpen} onOpenChange={setLawyersOpen}>
        <Card className="bg-card border-border shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Assigned Lawyers</CardTitle>
                  <Badge variant="outline" className="text-xs">{assignedLawyers?.length || 0}</Badge>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${lawyersOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {assignedLawyers && assignedLawyers.length > 0 ? (
                <div className="space-y-2">
                  {assignedLawyers.map((lawyer: any) => (
                    <div key={lawyer.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {getInitials(lawyer.profiles?.full_name || 'Unknown')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {lawyer.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lawyer.profiles?.email || 'No email'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">{lawyer.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No lawyers assigned</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};