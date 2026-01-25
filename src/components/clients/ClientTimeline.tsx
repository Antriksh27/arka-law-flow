import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, Calendar, CheckSquare, StickyNote, 
  Briefcase, Loader2, Clock, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface ClientTimelineProps {
  clientId: string;
}

interface TimelineEvent {
  id: string;
  entityId: string;
  type: 'case' | 'appointment' | 'document' | 'task' | 'note' | 'invoice';
  title: string;
  description: string;
  date: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

const getEventStyle = (type: string) => {
  switch (type) {
    case 'case':
      return { iconBg: 'bg-sky-100', iconColor: 'text-sky-500' };
    case 'appointment':
      return { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500' };
    case 'document':
      return { iconBg: 'bg-violet-100', iconColor: 'text-violet-500' };
    case 'task':
      return { iconBg: 'bg-amber-100', iconColor: 'text-amber-500' };
    case 'note':
      return { iconBg: 'bg-rose-100', iconColor: 'text-rose-500' };
    case 'invoice':
      return { iconBg: 'bg-indigo-100', iconColor: 'text-indigo-500' };
    default:
      return { iconBg: 'bg-slate-100', iconColor: 'text-slate-500' };
  }
};

const formatEventDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  }
  const distance = formatDistanceToNow(date, { addSuffix: true });
  return distance;
};

const formatFullDate = (dateStr: string) => {
  return format(new Date(dateStr), 'MMM d, yyyy');
};

export const ClientTimeline: React.FC<ClientTimelineProps> = ({ clientId }) => {
  const [showAll, setShowAll] = React.useState(false);
  const navigate = useNavigate();
  const initialCount = 8;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['client-timeline', clientId],
    queryFn: async () => {
      const timelineEvents: TimelineEvent[] = [];

      // Fetch cases
      const { data: cases } = await supabase
        .from('cases')
        .select('id, case_title, case_number, created_at, filing_date')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      cases?.forEach((caseItem) => {
        const style = getEventStyle('case');
        timelineEvents.push({
          id: `case-${caseItem.id}`,
          entityId: caseItem.id,
          type: 'case',
          title: 'Case Created',
          description: `${caseItem.case_number}: ${caseItem.case_title || 'Untitled'}`,
          date: caseItem.created_at,
          icon: Briefcase,
          ...style
        });
      });

      // Fetch appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, type, start_time, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      appointments?.forEach((apt) => {
        const style = getEventStyle('appointment');
        timelineEvents.push({
          id: `appointment-${apt.id}`,
          entityId: apt.id,
          type: 'appointment',
          title: 'Appointment Scheduled',
          description: apt.type || 'Meeting',
          date: apt.created_at,
          icon: Calendar,
          ...style
        });
      });

      // Fetch documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id, title, file_name, uploaded_at')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false })
        .limit(10);

      documents?.forEach((doc) => {
        const style = getEventStyle('document');
        timelineEvents.push({
          id: `document-${doc.id}`,
          entityId: doc.id,
          type: 'document',
          title: 'Document Added',
          description: doc.title || doc.file_name,
          date: doc.uploaded_at,
          icon: FileText,
          ...style
        });
      });

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      tasks?.forEach((task) => {
        const style = getEventStyle('task');
        timelineEvents.push({
          id: `task-${task.id}`,
          entityId: task.id,
          type: 'task',
          title: 'Task Created',
          description: task.title,
          date: task.created_at,
          icon: CheckSquare,
          ...style
        });
      });

      // Fetch notes
      const { data: notes } = await supabase
        .from('notes_v2')
        .select('id, title, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      notes?.forEach((note) => {
        const style = getEventStyle('note');
        timelineEvents.push({
          id: `note-${note.id}`,
          entityId: note.id,
          type: 'note',
          title: 'Note Added',
          description: note.title,
          date: note.created_at,
          icon: StickyNote,
          ...style
        });
      });

      // Sort all events by date
      return timelineEvents.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
  });

  const handleEventClick = (event: TimelineEvent) => {
    switch (event.type) {
      case 'case':
        navigate(`/cases/${event.entityId}`);
        break;
      case 'appointment':
        navigate(`/appointments?id=${event.entityId}`);
        break;
      case 'document':
        navigate(`/documents?id=${event.entityId}`);
        break;
      case 'task':
        navigate(`/tasks?id=${event.entityId}`);
        break;
      case 'note':
        navigate(`/notes?id=${event.entityId}`);
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-base font-medium text-foreground">No activity yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Activity will appear here as you work with this client
        </p>
      </div>
    );
  }

  const displayedEvents = showAll ? events : events.slice(0, initialCount);
  const remainingCount = events.length - initialCount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Activity</h3>
        <span className="text-sm text-muted-foreground">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayedEvents.map((event, index) => {
            const Icon = event.icon;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                onClick={() => handleEventClick(event)}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                    event.iconBg
                  )}>
                    <Icon className={cn("w-5 h-5", event.iconColor)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {event.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {event.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          {formatEventDate(event.date)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {formatFullDate(event.date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More Button */}
      {remainingCount > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-2"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {showAll ? 'Show Less' : `Show ${remainingCount} More`}
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
  );
};
