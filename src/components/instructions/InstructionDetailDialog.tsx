import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Calendar,
  MessageSquare,
  Send,
  AtSign,
  Edit,
  Save,
  X,
  Reply,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Instruction {
  id: string;
  message: string;
  priority: string;
  status: string;
  deadline: string | null;
  created_at: string;
  lawyer_id: string;
  staff_id: string | null;
  case_id: string | null;
  case_title?: string;
  lawyer_name?: string;
}

interface InstructionReply {
  id: string;
  reply_message: string;
  created_by: string;
  created_at: string;
  is_from_lawyer: boolean;
  tagged_user_id: string | null;
  is_status_update: boolean;
  old_status: string | null;
  new_status: string | null;
  creator_name?: string;
  tagged_user_name?: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
}

interface InstructionDetailDialogProps {
  instruction: Instruction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const InstructionDetailDialog: React.FC<InstructionDetailDialogProps> = ({
  instruction,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replies, setReplies] = useState<InstructionReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [taggedUser, setTaggedUser] = useState<string>('none');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');
  const [editedPriority, setEditedPriority] = useState('');
  const [editedDeadline, setEditedDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (instruction && isOpen) {
      fetchReplies();
      fetchTeamMembers();
      setEditedMessage(instruction.message);
      setEditedPriority(instruction.priority);
      setEditedDeadline(instruction.deadline || '');
    }
  }, [instruction, isOpen]);

  const fetchReplies = async () => {
    if (!instruction) return;

    try {
      const { data, error } = await supabase
        .from('instruction_replies')
        .select('*')
        .eq('instruction_id', instruction.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get creator names and tagged user names
      const repliesWithNames = await Promise.all(
        (data || []).map(async (reply) => {
          const [creatorData, taggedData] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', reply.created_by).single(),
            reply.tagged_user_id 
              ? supabase.from('profiles').select('full_name').eq('id', reply.tagged_user_id).single()
              : null
          ]);

          return {
            ...reply,
            creator_name: creatorData?.data?.full_name || 'Unknown',
            tagged_user_name: taggedData?.data?.full_name || null,
          };
        })
      );

      setReplies(repliesWithNames);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Get team members first
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('user_id, role')
        .neq('user_id', user?.id);

      if (teamError) throw teamError;

      // Get profile data for each team member
      const members = await Promise.all(
        (teamData || []).map(async (member) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', member.user_id)
            .single();

          return {
            id: member.user_id,
            full_name: profileData?.full_name || 'Unknown',
            role: member.role,
          };
        })
      );

      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !instruction) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('instruction_replies')
        .insert({
          instruction_id: instruction.id,
          reply_message: newReply,
          created_by: user?.id,
          is_from_lawyer: instruction.lawyer_id === user?.id,
          tagged_user_id: taggedUser === 'none' ? null : taggedUser,
        });

      if (error) throw error;

      setNewReply('');
      setTaggedUser('none');
      fetchReplies();
      
      toast({
        title: "Reply sent",
        description: "Your reply has been added to the instruction",
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!instruction) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('instructions')
        .update({
          message: editedMessage,
          priority: editedPriority,
          deadline: editedDeadline || null,
        })
        .eq('id', instruction.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
      
      toast({
        title: "Instruction updated",
        description: "The instruction has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating instruction:', error);
      toast({
        title: "Error",
        description: "Failed to update instruction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!instruction) return;

    try {
      const { error } = await supabase
        .from('instructions')
        .update({ status: newStatus })
        .eq('id', instruction.id);

      if (error) throw error;

      // Add status update reply
      await supabase
        .from('instruction_replies')
        .insert({
          instruction_id: instruction.id,
          reply_message: `Status changed from ${instruction.status} to ${newStatus}`,
          created_by: user?.id,
          is_from_lawyer: instruction.lawyer_id === user?.id,
          is_status_update: true,
          old_status: instruction.status,
          new_status: newStatus,
        });

      onUpdate();
      fetchReplies();
      
      toast({
        title: "Status updated",
        description: `Instruction marked as ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'error';
      case 'medium': return 'default';
      case 'low': return 'success';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'error';
      case 'accepted': return 'default';
      case 'in_progress': return 'default';
      case 'completed': return 'success';
      default: return 'outline';
    }
  };

  if (!instruction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Instruction Details</span>
            <div className="flex items-center gap-2">
              <Badge variant={getPriorityColor(instruction.priority)}>
                {instruction.priority}
              </Badge>
              <Badge variant={getStatusColor(instruction.status)}>
                {instruction.status.replace('_', ' ')}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              From: {instruction.lawyer_name}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Created: {new Date(instruction.created_at).toLocaleDateString()}
            </div>
            {instruction.deadline && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Due: {new Date(instruction.deadline).toLocaleDateString()}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Instruction Content */}
        <div className="flex-shrink-0 space-y-4 p-4 border-b">
          {/* Status Controls */}
          <div className="flex items-center gap-2">
            <Select value={instruction.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            {instruction.lawyer_id === user?.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>

          {/* Instruction Message */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={editedPriority} onValueChange={setEditedPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Deadline</label>
                  <Input
                    type="date"
                    value={editedDeadline}
                    onChange={(e) => setEditedDeadline(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{instruction.message}</p>
              {instruction.case_title && (
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Case:</strong> {instruction.case_title}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Replies Section */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b flex-shrink-0">
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">Conversation ({replies.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {replies.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No replies yet. Start the conversation!</p>
                </div>
              ) : (
                replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex gap-3 ${
                      reply.created_by === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        reply.created_by === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } ${
                        reply.is_status_update ? 'bg-secondary text-secondary-foreground' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{reply.creator_name}</span>
                        <span className="text-xs opacity-70">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                        {reply.is_from_lawyer && (
                          <Badge variant="outline" className="text-xs">Lawyer</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm">{reply.reply_message}</p>
                      
                      {reply.tagged_user_name && (
                        <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                          <AtSign className="w-3 h-3" />
                          <span>Tagged: {reply.tagged_user_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Reply Input - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t bg-background">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4" />
              <span className="text-sm font-medium">Add Reply</span>
            </div>
            
            <div className="flex gap-2">
              <Select value={taggedUser} onValueChange={setTaggedUser}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tag someone (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No one</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your reply..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button 
                onClick={handleSendReply} 
                disabled={!newReply.trim() || loading}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};