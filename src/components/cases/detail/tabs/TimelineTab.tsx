import React from 'react';
import { Timeline } from '@/components/ui/timeline';
import { Calendar, FileText, Scale, AlertCircle } from 'lucide-react';

interface TimelineTabProps {
  caseId: string;
  caseData: any;
  legalkartData?: any;
  hearings: any[];
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ caseData, legalkartData, hearings }) => {
  // Collect all timeline events
  const timelineEvents = [];

  // Add case creation
  if (caseData?.created_at) {
    timelineEvents.push({
      date: caseData.created_at,
      title: 'Case Created',
      description: `Case ${caseData.case_title} was created`,
      icon: <FileText className="h-3 w-3" />,
    });
  }

  // Add filing date
  if (caseData?.filing_date) {
    timelineEvents.push({
      date: caseData.filing_date,
      title: 'Case Filed',
      description: `Filing Number: ${caseData.filing_number || 'N/A'}`,
      icon: <FileText className="h-3 w-3" />,
    });
  }

  // Add registration date
  if (caseData?.registration_date) {
    timelineEvents.push({
      date: caseData.registration_date,
      title: 'Case Registered',
      description: `Registration Number: ${caseData.registration_number || 'N/A'}`,
      icon: <FileText className="h-3 w-3" />,
    });
  }

  // Add first hearing date
  if (caseData?.first_hearing_date) {
    timelineEvents.push({
      date: caseData.first_hearing_date,
      title: 'First Hearing',
      description: 'First hearing scheduled',
      icon: <Calendar className="h-3 w-3" />,
    });
  }

  // Add hearings from legalkart data
  if (hearings && hearings.length > 0) {
    hearings.forEach((hearing) => {
      if (hearing.hearing_date) {
        timelineEvents.push({
          date: hearing.hearing_date,
          title: 'Hearing',
          description: hearing.business_on_date || hearing.purpose || 'Hearing scheduled',
          icon: <Scale className="h-3 w-3" />,
        });
      }
    });
  }

  // Add next hearing date
  if (caseData?.next_hearing_date) {
    const nextHearingDate = new Date(caseData.next_hearing_date);
    if (nextHearingDate > new Date()) {
      timelineEvents.push({
        date: caseData.next_hearing_date,
        title: 'Next Hearing',
        description: 'Upcoming hearing scheduled',
        icon: <Calendar className="h-3 w-3" />,
      });
    }
  }

  // Add scrutiny date
  if (caseData?.scrutiny_date) {
    timelineEvents.push({
      date: caseData.scrutiny_date,
      title: 'Scrutiny Date',
      description: 'Case scrutiny scheduled',
      icon: <AlertCircle className="h-3 w-3" />,
    });
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Case Timeline</h3>
      
      {timelineEvents.length > 0 ? (
        <Timeline
          items={timelineEvents}
          initialCount={10}
          showMoreText="Load More Events"
          showLessText="Show Less"
          dotClassName="bg-gradient-to-b from-background to-muted ring-1 ring-border"
          lineClassName="border-l border-border"
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No timeline events available</p>
        </div>
      )}
    </div>
  );
};
