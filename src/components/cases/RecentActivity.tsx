
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface RecentActivityProps {
  caseId: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ caseId }) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_activities')
        .select(`
          *,
          profiles!case_activities_created_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(3);
      
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
      <div className="space-y-2">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/5 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="border-l-2 border-gray-200 pl-3">
          <p className="text-sm font-medium text-gray-900">
            {getActivityTypeLabel(activity.activity_type)}
          </p>
          <p className="text-xs text-gray-500">
            {format(new Date(activity.created_at), 'MMM d, h:mm a')}
          </p>
        </div>
      ))}
    </div>
  );
};
