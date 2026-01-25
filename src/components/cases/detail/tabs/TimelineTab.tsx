import React, { useState } from 'react';
import { Calendar, FileText, Scale, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface TimelineTabProps {
  caseId: string;
  caseData: any;
  legalkartData?: any;
  hearings: any[];
}

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ caseData, legalkartData, hearings }) => {
  const isMobile = useIsMobile();
  const [showAll, setShowAll] = useState(false);
  const initialCount = 10;
  
  // Collect all timeline events
  const timelineEvents: TimelineEvent[] = [];

  // Add case creation
  if (caseData?.created_at) {
    timelineEvents.push({
      date: caseData.created_at,
      title: 'Case Created',
      description: `Case ${caseData.case_title} was created`,
      icon: <FileText className="h-3 w-3" />,
      iconBg: 'bg-violet-100 text-violet-600',
    });
  }

  // Add filing date
  if (caseData?.filing_date) {
    timelineEvents.push({
      date: caseData.filing_date,
      title: 'Case Filed',
      description: `Filing Number: ${caseData.filing_number || 'N/A'}`,
      icon: <FileText className="h-3 w-3" />,
      iconBg: 'bg-sky-100 text-sky-600',
    });
  }

  // Add registration date
  if (caseData?.registration_date) {
    timelineEvents.push({
      date: caseData.registration_date,
      title: 'Case Registered',
      description: `Registration Number: ${caseData.registration_number || 'N/A'}`,
      icon: <FileText className="h-3 w-3" />,
      iconBg: 'bg-emerald-100 text-emerald-600',
    });
  }

  // Add first hearing date
  if (caseData?.first_hearing_date) {
    timelineEvents.push({
      date: caseData.first_hearing_date,
      title: 'First Hearing',
      description: 'First hearing scheduled',
      icon: <Calendar className="h-3 w-3" />,
      iconBg: 'bg-amber-100 text-amber-600',
    });
  }

  // Add hearings from legalkart data
  if (hearings && hearings.length > 0) {
    hearings.forEach((hearing) => {
      if (hearing.hearing_date) {
        const details: string[] = [];
        
        if (hearing.hearing_type) {
          details.push(`Type: ${hearing.hearing_type}`);
        }
        
        if (hearing.purpose_of_hearing) {
          details.push(`Purpose: ${hearing.purpose_of_hearing}`);
        } else if (hearing.business_on_date && !hearing.business_on_date.includes('{') && !hearing.business_on_date.includes('[')) {
          details.push(hearing.business_on_date);
        }
        
        if (hearing.judge) {
          details.push(`Judge: ${hearing.judge}`);
        } else if (hearing.coram) {
          details.push(`Coram: ${hearing.coram}`);
        }
        
        if (hearing.court_name) {
          details.push(`Court: ${hearing.court_name}`);
        }
        if (hearing.bench) {
          details.push(`Bench: ${hearing.bench}`);
        }
        
        if (hearing.outcome) {
          details.push(`Outcome: ${hearing.outcome}`);
        }
        
        const description = details.length > 0 ? details.join(' • ') : 'Hearing scheduled';
        
        timelineEvents.push({
          date: hearing.hearing_date,
          title: hearing.hearing_type || 'Hearing',
          description: description,
          icon: <Scale className="h-3 w-3" />,
          iconBg: 'bg-amber-100 text-amber-600',
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
        iconBg: 'bg-sky-100 text-sky-600',
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
      iconBg: 'bg-rose-100 text-rose-600',
    });
  }

  // Sort events by date (newest first)
  const sortedEvents = [...timelineEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const visibleEvents = showAll ? sortedEvents : sortedEvents.slice(0, initialCount);
  const hasMoreEvents = sortedEvents.length > initialCount;

  const formatEventDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Case Timeline</h3>
          <span className="text-xs text-slate-500">{sortedEvents.length} events</span>
        </div>
        
        {sortedEvents.length > 0 ? (
          <div className="space-y-3">
            {visibleEvents.map((event, index) => {
              const isLast = index === visibleEvents.length - 1;
              return (
                <motion.div
                  key={`${event.date}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="relative pl-8"
                >
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-200" />
                  )}

                  {/* Timeline dot with icon */}
                  <div className={cn(
                    "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center",
                    event.iconBg
                  )}>
                    {event.icon}
                  </div>

                  {/* Content card */}
                  <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <div className="text-[10px] text-slate-400 font-medium mb-1">
                      {formatEventDate(event.date)}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-0.5">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Show More/Less Button */}
            {hasMoreEvents && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-2"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-slate-500"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show All (${sortedEvents.length - initialCount} more)`}
                  <motion.div
                    animate={{ rotate: showAll ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No timeline events available</p>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Case Timeline</h3>
        <span className="text-sm text-slate-500">{sortedEvents.length} events</span>
      </div>
      
      {sortedEvents.length > 0 ? (
        <div className="space-y-4">
          {visibleEvents.map((event, index) => {
            const isLast = index === visibleEvents.length - 1;
            return (
              <motion.div
                key={`${event.date}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="relative pl-10"
              >
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-slate-200" />
                )}

                {/* Timeline dot with icon */}
                <div className={cn(
                  "absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm",
                  event.iconBg
                )}>
                  {event.icon}
                </div>

                {/* Content card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-semibold text-slate-900">
                      {event.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {formatEventDate(event.date)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-600">
                      {event.description}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Show More/Less Button */}
          {hasMoreEvents && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center pt-4"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : `Load More (${sortedEvents.length - initialCount} more)`}
                <motion.div
                  animate={{ rotate: showAll ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">No timeline events available</p>
        </div>
      )}
    </div>
  );
};
