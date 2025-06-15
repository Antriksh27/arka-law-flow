
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTeamMembers } from '@/components/team/useTeamMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';


interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (threadId: string) => void;
}

export const NewChatDialog: React.FC<NewChatDialogProps> = ({ open, onOpenChange, onChatCreated }) => {
  const { user } = useAuth();
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const handleCreateChat = async () => {
    if (!selectedUserId) return;
    setIsCreating(true);

    try {
      // For now, we will create a new thread every time.
      // A better implementation would check for an existing thread first.
      const { data: newThreadId, error } = await supabase.rpc('create_private_thread', {
        p_other_user_id: selectedUserId,
      });

      if (error) throw error;
      
      toast({ title: "Success", description: "New chat created." });
      await queryClient.invalidateQueries({ queryKey: ['threads'] });
      onChatCreated(newThreadId);
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
      setIsCreating(false);
    }
  };
  
  const otherMembers = teamMembers.filter(member => member.user_id !== user?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>Select a team member to start a conversation with.</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
          {isLoading && <p>Loading team members...</p>}
          {otherMembers.map((member) => (
            <div
              key={member.user_id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedUserId === member.user_id ? 'bg-accent' : 'hover:bg-gray-100'}`}
              onClick={() => setSelectedUserId(member.user_id)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar_url || ''} />
                <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{member.full_name}</p>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreateChat} disabled={!selectedUserId || isCreating}>
            {isCreating ? 'Creating...' : 'Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
