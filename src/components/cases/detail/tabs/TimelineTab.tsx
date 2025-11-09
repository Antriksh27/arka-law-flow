import React from 'react';
import TimeUtils from '@/lib/timeUtils';
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
      date: new Date(caseData.created_at),
      title: 'Case Created',
      description: `Case ${caseData.case_title} was created`,
      icon: FileText,
      color: 'blue'
    });
  }

  // Add filing date
  if (caseData?.filing_date) {
    timelineEvents.push({
      date: new Date(caseData.filing_date),
      title: 'Case Filed',
      description: `Filing Number: ${caseData.filing_number || 'N/A'}`,
      icon: FileText,
      color: 'blue'
    });
  }

  // Add registration date
  if (caseData?.registration_date) {
    timelineEvents.push({
      date: new Date(caseData.registration_date),
      title: 'Case Registered',
      description: `Registration Number: ${caseData.registration_number || 'N/A'}`,
      icon: FileText,
      color: 'green'
    });
  }

  // Add first hearing date
  if (caseData?.first_hearing_date) {
    timelineEvents.push({
      date: new Date(caseData.first_hearing_date),
      title: 'First Hearing',
      description: 'First hearing scheduled',
      icon: Calendar,
      color: 'purple'
    });
  }

  // Add hearings from legalkart data
  if (hearings && hearings.length > 0) {
    hearings.forEach((hearing) => {
      if (hearing.hearing_date) {
        timelineEvents.push({
          date: new Date(hearing.hearing_date),
          title: 'Hearing',
          description: hearing.business_on_date || hearing.purpose || 'Hearing scheduled',
          icon: Scale,
          color: 'purple'
        });
      }
    });
  }

  // Add next hearing date
  if (caseData?.next_hearing_date) {
    const nextHearingDate = new Date(caseData.next_hearing_date);
    if (nextHearingDate > new Date()) {
      timelineEvents.push({
        date: nextHearingDate,
        title: 'Next Hearing',
        description: 'Upcoming hearing scheduled',
        icon: Calendar,
        color: 'orange'
      });
    }
  }

  // Add scrutiny date
  if (caseData?.scrutiny_date) {
    timelineEvents.push({
      date: new Date(caseData.scrutiny_date),
      title: 'Scrutiny Date',
      description: 'Case scrutiny scheduled',
      icon: AlertCircle,
      color: 'yellow'
    });
  }

  // Sort events by date
  timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700',
      yellow: 'bg-yellow-100 text-yellow-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Case Timeline</h3>
      
      {timelineEvents.length > 0 ? (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {timelineEvents.map((event, index) => {
              const IconComponent = event.icon;
              return (
                <div key={index} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getColorClass(event.color)}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-base">{event.title}</h4>
                      <span className="text-sm text-gray-500">
                        {TimeUtils.formatDate(event.date, 'dd MMM yyyy')} (IST)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No timeline events available</p>
        </div>
      )}
    </div>
  );
};
