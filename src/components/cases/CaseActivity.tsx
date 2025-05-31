
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  FileText, 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  Upload,
  Trash2,
  Edit,
  UserCheck,
  Gavel,
  Clock,
  AlertCircle,
  Users,
  Building2,
  FileCheck,
  Flag
} from 'lucide-react';
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
      case 'case_created':
        return <FileCheck className="w-4 h-4 text-green-600" />;
      case 'case_title_changed':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'status_changed':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'priority_changed':
        return <Flag className="w-4 h-4 text-red-600" />;
      case 'client_assigned':
        return <UserCheck className="w-4 h-4 text-purple-600" />;
      case 'assignment_changed':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'filing_date_changed':
      case 'next_hearing_changed':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'description_updated':
        return <Edit className="w-4 h-4 text-gray-600" />;
      case 'court_changed':
        return <Building2 className="w-4 h-4 text-yellow-600" />;
      case 'petitioner_changed':
      case 'respondent_changed':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'filing_number_changed':
      case 'cnr_number_changed':
        return <FileText className="w-4 h-4 text-teal-600" />;
      case 'document_uploaded':
        return <Upload className="w-4 h-4 text-blue-600" />;
      case 'document_deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'hearing_scheduled':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'hearing_rescheduled':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'hearing_status_changed':
        return <Gavel className="w-4 h-4 text-purple-600" />;
      case 'task_created':
        return <CheckSquare className="w-4 h-4 text-purple-600" />;
      case 'task_status_changed':
        return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'case_created':
        return 'bg-green-100';
      case 'status_changed':
      case 'priority_changed':
        return 'bg-orange-100';
      case 'document_uploaded':
        return 'bg-blue-100';
      case 'document_deleted':
        return 'bg-red-100';
      case 'hearing_scheduled':
      case 'hearing_rescheduled':
        return 'bg-green-100';
      case 'task_created':
      case 'task_status_changed':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

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

  const formatMetadata = (metadata: any, activityType: string) => {
    if (!metadata) return null;

    switch (activityType) {
      case 'document_uploaded':
        return (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">File:</span> {metadata.file_name}
            {metadata.file_type && <span className="ml-2">({metadata.file_type.toUpperCase()})</span>}
            {metadata.file_size && (
              <span className="ml-2">• {(metadata.file_size / 1024).toFixed(1)} KB</span>
            )}
          </div>
        );
      case 'hearing_scheduled':
        return (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Date:</span> {format(new Date(metadata.hearing_date), 'MMM d, yyyy')}
            {metadata.hearing_type && (
              <span className="ml-2">• <span className="font-medium">Type:</span> {metadata.hearing_type}</span>
            )}
          </div>
        );
      case 'task_created':
        return (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Task:</span> {metadata.task_title}
            {metadata.due_date && (
              <span className="ml-2">• <span className="font-medium">Due:</span> {format(new Date(metadata.due_date), 'MMM d, yyyy')}</span>
            )}
          </div>
        );
      default:
        if (metadata.old_value && metadata.new_value) {
          return (
            <div className="mt-2 text-xs text-gray-600">
              <span className="text-red-600">"{metadata.old_value}"</span>
              <span className="mx-2">→</span>
              <span className="text-green-600">"{metadata.new_value}"</span>
            </div>
          );
        }
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading activity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Feed</h3>
        <Badge variant="outline" className="text-xs">
          {activities?.length || 0} activities
        </Badge>
      </div>

      {activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className={`w-8 h-8 ${getActivityColor(activity.activity_type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                {getActivityIcon(activity.activity_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-medium">
                    {getActivityTypeLabel(activity.activity_type)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                
                <div className="flex items-start gap-2 mb-2">
                  <Avatar className="w-5 h-5 mt-0.5">
                    <AvatarFallback className="bg-gray-100 text-xs">
                      {activity.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{activity.profiles?.full_name || 'Unknown User'}</span>
                    <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                  </div>
                </div>
                
                {formatMetadata(activity.metadata, activity.activity_type)}
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
