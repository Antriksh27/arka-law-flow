import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Timeline } from '@/components/ui/timeline';
import { 
  FileText, Calendar, CheckSquare, StickyNote, 
  Briefcase, Loader2 
} from 'lucide-react';

interface ClientTimelineProps {
  clientId: string;
}

interface TimelineEvent {
  id: string;
  type: 'case' | 'appointment' | 'document' | 'task' | 'note' | 'invoice';
  title: string;
  description: string;
  date: string;
  icon: any;
  color: string;
}

export const ClientTimeline: React.FC<ClientTimelineProps> = ({ clientId }) => {
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
        timelineEvents.push({
          id: `case-${caseItem.id}`,
          type: 'case',
          title: 'Case Created',
          description: `${caseItem.case_number}: ${caseItem.case_title || 'Untitled'}`,
          date: caseItem.created_at,
          icon: Briefcase,
          color: 'blue'
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
        timelineEvents.push({
          id: `appointment-${apt.id}`,
          type: 'appointment',
          title: 'Appointment Scheduled',
          description: apt.type || 'Meeting',
          date: apt.created_at,
          icon: Calendar,
          color: 'green'
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
        timelineEvents.push({
          id: `document-${doc.id}`,
          type: 'document',
          title: 'Document Added',
          description: doc.title || doc.file_name,
          date: doc.uploaded_at,
          icon: FileText,
          color: 'purple'
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
        timelineEvents.push({
          id: `task-${task.id}`,
          type: 'task',
          title: 'Task Created',
          description: task.title,
          date: task.created_at,
          icon: CheckSquare,
          color: 'orange'
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
        timelineEvents.push({
          id: `note-${note.id}`,
          type: 'note',
          title: 'Note Added',
          description: note.title,
          date: note.created_at,
          icon: StickyNote,
          color: 'yellow'
        });
      });

      // Sort all events by date
      return timelineEvents.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No timeline events found
      </div>
    );
  }

  // Transform events to Timeline items format
  const timelineItems = events.map(event => ({
    date: event.date,
    title: event.title,
    description: event.description,
    icon: React.createElement(event.icon, { className: "h-3 w-3" }),
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity Timeline</h3>
      
      <Timeline
        items={timelineItems}
        initialCount={10}
        showMoreText="Load More Events"
        showLessText="Show Less"
        dotClassName="bg-gradient-to-b from-background to-muted ring-1 ring-border"
        lineClassName="border-l border-border"
      />
    </div>
  );
};
