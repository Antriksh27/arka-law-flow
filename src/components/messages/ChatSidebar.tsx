
import React from 'react';
import { Edit, Search } from 'lucide-react';
import { IconButton } from '@/components/messages/ui/IconButton';
import { TextField } from '@/components/messages/ui/TextField';
import ChatList from '@/components/messages/ui/ChatList';
import { useThreads } from '@/hooks/use-threads';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatSidebarProps {
  onSelectThread: (threadId: string) => void;
  selectedThreadId: string | null;
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSelectThread, selectedThreadId, onNewChat }) => {
    const { data: threadsData, isLoading } = useThreads();

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

    return (
        <div className="hidden md:flex w-80 flex-none flex-col items-start gap-4 self-stretch border-r border-solid border-gray-200 bg-white px-4 py-4 h-full">
            <div className="flex w-full items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 flex-grow">
                    Messages
                </h2>
                <IconButton
                    variant="brand-tertiary"
                    icon={<Edit className="w-4 h-4" />}
                    onClick={onNewChat}
                />
            </div>
            <TextField
                className="h-auto w-full flex-none"
                icon={<Search />}
            >
                <TextField.Input
                    placeholder="Search users or cases"
                />
            </TextField>
            <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 overflow-y-auto">
                {isLoading ? (
                    <div className="w-full space-y-4">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-6 w-1/3 mt-4" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <>
                        {threadsData?.directMessages && threadsData.directMessages.length > 0 && renderChatList("Direct Messages", threadsData.directMessages)}
                        {threadsData?.caseChannels && threadsData.caseChannels.length > 0 && renderChatList("Case Channels", threadsData.caseChannels)}
                        {threadsData?.directMessages.length === 0 && threadsData.caseChannels.length === 0 && (
                            <div className="text-center w-full text-gray-500 mt-8">
                                <p>No conversations yet.</p>
                                <p>Start a new chat to begin.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
