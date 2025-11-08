import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TimeUtils } from '@/lib/timeUtils';

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  timestamp: string;
}

interface TaskCommentsProps {
  taskId: string;
  comments: Comment[];
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, comments = [] }) => {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get user's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const comment: Comment = {
        id: crypto.randomUUID(),
        user_id: user.id,
        user_name: profile?.full_name || 'Unknown User',
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      // Get current comments
      const { data: task } = await supabase
        .from('tasks')
        .select('comments')
        .eq('id', taskId)
        .single();

      const currentComments = (task?.comments as Comment[]) || [];
      const updatedComments = [...currentComments, comment];

      // Update task with new comment
      const { error } = await supabase
        .from('tasks')
        .update({ comments: updatedComments })
        .eq('id', taskId);

      if (error) throw error;

      // Log to history
      await supabase.from('task_history').insert({
        task_id: taskId,
        user_id: user.id,
        user_name: profile?.full_name || 'Unknown User',
        action: 'commented',
        changes: { comment: text.trim() }
      });

      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setNewComment('');
      toast({ title: 'Comment added successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add comment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <h3 className="font-medium text-gray-900">Comments</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {getInitials(comment.user_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-sm text-gray-900">{comment.user_name}</p>
                  <span className="text-xs text-gray-500">
                    {TimeUtils.formatDateTime(comment.timestamp, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-gray-200">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[80px] bg-white border-gray-300 focus:border-blue-500"
          disabled={addCommentMutation.isPending}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </div>
  );
};
