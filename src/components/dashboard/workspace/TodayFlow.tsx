import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: string;
  type: 'appointment' | 'hearing' | 'task';
  time: string;
  title: string;
  subtitle: string;
  badge?: string;
  status?: string;
  completed?: boolean;
}

interface TodayFlowProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export const TodayFlow = ({ events, isLoading }: TodayFlowProps) => {
  const navigate = useNavigate();

  const handleViewEvent = async (event: TimelineEvent) => {
    if (event.type === 'appointment') {
      navigate('/appointments');
    } else if (event.type === 'hearing') {
      const { data: hearing } = await supabase
        .from('case_hearings')
        .select('case_id')
        .eq('id', event.id)
        .single();
      
      if (hearing?.case_id) {
        navigate(`/cases/${hearing.case_id}`);
      }
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      case 'hearing':
        return <span className="text-xl">⚖️</span>;
      case 'task':
        return <CheckCircle2 className="w-5 h-5 text-teal-600" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100/50 transition-colors';
      case 'hearing':
        return 'bg-amber-50 border-amber-200 hover:bg-amber-100/50 transition-colors';
      case 'task':
        return 'bg-teal-50 border-teal-200 hover:bg-teal-100/50 transition-colors';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100/50 transition-colors';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6 h-fit lg:sticky lg:top-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <h2 className="text-lg md:text-xl font-semibold">Today's Flow</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 h-fit lg:sticky lg:top-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        <h2 className="text-lg md:text-xl font-semibold">Today's Flow</h2>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No events scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4 relative">
          {/* Vertical timeline line */}
          <div className="absolute left-5 md:left-6 top-8 bottom-8 w-0.5 bg-gray-200" />
          
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              <div className={`border rounded-lg p-3 md:p-4 ${getEventColor(event.type)} relative`}>
                {/* Timeline dot */}
                <div className="absolute -left-[22px] md:-left-[26px] top-3 md:top-4 w-3 h-3 md:w-4 md:h-4 rounded-full bg-white border-2 border-primary z-10" />
                
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="mt-1 flex-shrink-0">{getEventIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground">
                        {event.time}
                      </span>
                      {event.badge && (
                        <Badge className="text-xs px-2 py-0 h-5">
                          {event.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm mb-1 truncate">{event.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{event.subtitle}</p>
                    
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {event.type === 'task' ? (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            Mark Done
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-xs"
                            onClick={() => handleViewEvent(event)}
                          >
                            View
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
