
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { TextField } from '@/components/messages/ui/TextField';
import ChatList from '@/components/messages/ui/ChatList';
import { useThreads } from '@/hooks/use-threads';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamMembers } from '@/components/team/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface ChatSidebarProps {
  onSelectThread: (threadId: string) => void;
  selectedThreadId: string | null;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSelectThread, selectedThreadId }) => {
    const { data: threadsData, isLoading: isLoadingThreads } = useThreads();
    const { user } = useAuth();
    const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useTeamMembers();
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const queryClient = useQueryClient();

    const handleCreateChat = async (selectedUserId: string) => {
        if (isCreatingChat) return;
        setIsCreatingChat(true);
    
        try {
          const { data: newThreadId, error } = await supabase.rpc('create_private_thread', {
            p_other_user_id: selectedUserId,
          });
    
          if (error) throw error;
          
          toast({ title: "Success", description: "Chat opened." });
          await queryClient.invalidateQueries({ queryKey: ['threads'] });
          onSelectThread(newThreadId as string);
        } catch (error: any) {
          console.error('Error creating chat:', error);
          toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setIsCreatingChat(false);
        }
      };

    const renderChatList = (title: string, threads: any[]) => (
        <>
            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                {title}
            </span>
            <ChatList>
                {threads.map((thread) => (
                    <ChatList.ChatListItem
                        key={thread.id}
                        avatar={thread.avatar}
                        name={thread.title}
                        message={thread.message}
                        timestamp={thread.timestamp}
                        selected={thread.id === selectedThreadId}
                        onClick={() => onSelectThread(thread.id)}
                    />
                ))}
            </ChatList>
        </>
    );

    const otherMembers = teamMembers.filter(member => member.user_id !== user?.id);
    const isLoading = isLoadingThreads || isLoadingTeamMembers;

    return (
        <div className="hidden md:flex w-80 flex-none flex-col items-start gap-4 self-stretch border-r border-solid border-gray-200 bg-white px-4 py-4 h-full">
            <div className="flex w-full items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 flex-grow">
                    Messages
                </h2>
            </div>
            <TextField
                className="h-auto w-full flex-none"
                icon={<Search />}
            >
                <TextField.Input
                    placeholder="Search users or cases"
                />
            </TextField>
            <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="w-full space-y-4">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-6 w-1/3 mt-4" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <>
                        {threadsData?.directMessages && threadsData.directMessages.length > 0 && renderChatList("Direct Messages", threadsData.directMessages)}
                        {threadsData?.caseChannels && threadsData.caseChannels.length > 0 && renderChatList("Case Channels", threadsData.caseChannels)}
                        
                        {otherMembers.length > 0 && (
                            <div className="w-full">
                                <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                                    Team Members
                                </span>
                                <ul className="w-full space-y-1 mt-2">
                                    {otherMembers.map((member) => (
                                        <li
                                            key={member.user_id}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors w-full`}
                                            onClick={() => handleCreateChat(member.user_id)}
                                            aria-disabled={isCreatingChat}
                                        >
                                            <Avatar className="h-10 w-10 flex-shrink-0">
                                                <AvatarImage src={member.avatar_url || ''} alt={member.full_name} />
                                                <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate text-gray-900">{member.full_name}</p>
                                                <p className="text-sm text-gray-600 truncate">{member.role}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {!isLoading && threadsData?.directMessages.length === 0 && threadsData.caseChannels.length === 0 && otherMembers.length === 0 && (
                            <div className="text-center w-full text-gray-500 mt-8">
                                <p>No conversations yet.</p>
                                <p>No team members to start a chat with.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
