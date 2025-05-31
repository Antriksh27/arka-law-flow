
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';

interface RecentActivityProps {
  caseId: string;
  limit?: number;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ caseId, limit = 3 }) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-case-activities', caseId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_activities')
        .select('id, activity_type, description, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    }
  });

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'case_created': 'Case Created',
      'case_title_changed': 'Title Changed',
      'status_changed': 'Status Updated',
      'priority_changed': 'Priority Changed',
      'client_assigned': 'Client Assignment',
      'assignment_changed': 'Assignment Changed',
      'filing_date_changed': 'Filing Date Updated',
      'next_hearing_changed': 'Next Hearing Updated',
      'description_updated': 'Description Updated',
      'court_changed': 'Court Information',
      'petitioner_changed': 'Petitioner Updated',
      'respondent_changed': 'Respondent Updated',
      'filing_number_changed': 'Filing Number Updated',
      'cnr_number_changed': 'CNR Number Updated',
      'document_uploaded': 'Document Upload',
      'document_deleted': 'Document Deleted',
      'hearing_scheduled': 'Hearing Scheduled',
      'hearing_rescheduled': 'Hearing Rescheduled',
      'hearing_status_changed': 'Hearing Status',
      'task_created': 'Task Created',
      'task_status_changed': 'Task Updated',
      'message_sent': 'Message Sent'
    };
    return labels[type] || 'Activity';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Recent Activity
      </h3>
      
      {activities && activities.length > 0 ? (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div key={activity.id} className="border-l-2 border-blue-200 pl-3 py-1">
              <div className="text-sm font-medium text-gray-900">
                {getActivityTypeLabel(activity.activity_type)}
              </div>
              <div className="text-xs text-gray-500">
                {format(new Date(activity.created_at), 'MMM d, h:mm a')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
};
