
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity, FileText, Calendar, CheckSquare, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface CaseActivityProps {
  caseId: string;
}

export const CaseActivity: React.FC<CaseActivityProps> = ({ caseId }) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['case-activities', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_activities')
        .select(`
          *,
          profiles!case_activities_created_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_uploaded':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'hearing_scheduled':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'task_created':
        return <CheckSquare className="w-4 h-4 text-purple-600" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading activity...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Feed</h3>
      </div>

      {activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 p-4 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                {getActivityIcon(activity.activity_type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-gray-100 text-xs">
                      {activity.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{activity.profiles?.full_name}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700">{activity.description}</p>
                
                {activity.metadata && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    Additional details: {JSON.stringify(activity.metadata)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No activity recorded yet</p>
          <p className="text-sm">Activity will appear here as you work on this case</p>
        </div>
      )}
    </div>
  );
};
