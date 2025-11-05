import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Calendar, CheckSquare, StickyNote, 
  Briefcase, DollarSign, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';

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
      <div className="text-center py-12 text-gray-500">
        No timeline events found
      </div>
    );
  }

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Timeline events */}
        <div className="space-y-4">
          {events.map((event, index) => {
            const IconComponent = event.icon;
            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getColorClass(event.color)}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                {/* Content */}
                <div className="flex-1 pb-4">
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 capitalize">
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(event.date), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
