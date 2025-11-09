import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, User, TrendingUp, MessageSquare, Paperclip, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TimeUtils } from '@/lib/timeUtils';

interface TaskTimelineProps {
  taskId: string;
}

interface HistoryItem {
  id: string;
  action: string;
  user_name: string;
  changes: any;
  created_at: string;
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ taskId }) => {
  const { data: history = [], isLoading } = useQuery<HistoryItem[]>({
    queryKey: ['task-history', taskId],
    queryFn: async () => {
      const { data: historyData, error } = await (supabase as any)
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user names from team_members
      const userIds = [...new Set((historyData || []).map((h: any) => h.user_id).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        const memberMap: Record<string, string> = {};
        (members || []).forEach(m => {
          if (m.user_id) memberMap[m.user_id] = m.full_name;
        });
        
        return (historyData || []).map((h: any) => ({
          ...h,
          user_name: h.user_id && memberMap[h.user_id] ? memberMap[h.user_id] : 'Unknown User'
        })) as HistoryItem[];
      }
      
      return (historyData || []).map((h: any) => ({
        ...h,
        user_name: 'Unknown User'
      })) as HistoryItem[];
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'status_changed':
        return <TrendingUp className="w-4 h-4" />;
      case 'assigned':
        return <User className="w-4 h-4" />;
      case 'progress_updated':
        return <TrendingUp className="w-4 h-4" />;
      case 'commented':
        return <MessageSquare className="w-4 h-4" />;
      case 'attachment_added':
        return <Paperclip className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'status_changed':
        return 'bg-yellow-100 text-yellow-700';
      case 'assigned':
        return 'bg-purple-100 text-purple-700';
      case 'progress_updated':
        return 'bg-orange-100 text-orange-700';
      case 'commented':
        return 'bg-indigo-100 text-indigo-700';
      case 'attachment_added':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionText = (item: HistoryItem) => {
    const userName = item.user_name || 'Unknown User';
    
    switch (item.action) {
      case 'created':
        return `${userName} created this task`;
      case 'completed':
        return `${userName} marked this task as completed`;
      case 'status_changed':
        return `${userName} changed status from ${item.changes?.old_status || 'N/A'} to ${item.changes?.new_status || 'N/A'}`;
      case 'assigned':
        return `${userName} assigned this task`;
      case 'progress_updated':
        return `${userName} updated progress from ${item.changes?.old_progress || 0}% to ${item.changes?.new_progress || 0}%`;
      case 'commented':
        return `${userName} added a comment`;
      case 'attachment_added':
        return `${userName} added an attachment: ${item.changes?.file_name || 'file'}`;
      default:
        return `${userName} performed an action`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">Timeline</h3>
        </div>
        <p className="text-sm text-gray-500">Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <h3 className="font-medium text-gray-900">Timeline</h3>
        <span className="text-sm text-gray-500">({history.length})</span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="relative space-y-4 pl-8">
          {/* Timeline Line */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />

          {history.map((item, index) => (
            <div key={item.id} className="relative">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-8 mt-1 p-2 rounded-full ${getActionColor(item.action)}`}
              >
                {getActionIcon(item.action)}
              </div>

              {/* Timeline Content */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-900 font-medium mb-1">
                  {getActionText(item)}
                </p>
                <p className="text-xs text-gray-500">
                  {TimeUtils.formatDateTime(item.created_at, 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
