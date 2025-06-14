
import React, { useState } from 'react';
import { Edit, Search, Paperclip, Phone, Send } from 'lucide-react';

import DefaultPageLayout from '@/components/messages/ui/DefaultPageLayout';
import { IconButton } from '@/components/messages/ui/IconButton';
import { TextField } from '@/components/messages/ui/TextField';
import ChatList from '@/components/messages/ui/ChatList';
import ChatHeader from '@/components/messages/ui/ChatHeader';
import TimelineDivider from '@/components/messages/ui/TimelineDivider';
import ChatReceived from '@/components/messages/ui/ChatReceived';
import ChatSent from '@/components/messages/ui/ChatSent';
import { TextFieldUnstyled } from '@/components/messages/ui/TextFieldUnstyled';

const Messages = () => {
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');

    return (
        <DefaultPageLayout>
        <div className="flex h-full w-full items-start">
            <div className="hidden md:flex w-80 flex-none flex-col items-start gap-4 self-stretch border-r border-gray-200 bg-white p-4">
                <div className="flex w-full items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">
                        Messages
                    </h1>
                    <IconButton
                        variant="brand-tertiary"
                        icon={<Edit className="w-4 h-4" />}
                        onClick={() => {}}
                    />
                </div>
                <TextField
                    className="w-full"
                    variant="filled"
                    icon={<Search className="w-4 h-4" />}
                >
                    <TextField.Input
                        placeholder="Search users or cases"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </TextField>
                <div className="flex w-full flex-1 flex-col items-start gap-4 overflow-auto">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                        DIRECT MESSAGES
                    </span>
                    <ChatList>
                    <ChatList.ChatListItem
                        avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
                        name="Rahul Mehta"
                        message="Can you review the contract?"
                        timestamp="2m ago"
                        selected={true}
                    />
                    <ChatList.ChatListItem
                        avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
                        name="Priya Singh"
                        message="Documents received"
                        timestamp="1h ago"
                        unread={true}
                    />
                    <ChatList.ChatListItem
                        avatar="https://images.unsplash.com/photo-1560250097-0b93528c311a"
                        name="Amit Kumar"
                        message="Meeting scheduled for tomorrow"
                        timestamp="3h ago"
                    />
                    </ChatList>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mt-4">
                        CASE CHANNELS
                    </span>
                    <ChatList>
                    <ChatList.ChatListItem
                        avatar="https://images.unsplash.com/photo-1589829545856-d10d557cf95f"
                        name="Property Dispute #45"
                        message="New evidence submitted"
                        timestamp="5m ago"
                        unread={true}
                    />
                    <ChatList.ChatListItem
                        avatar="https://images.unsplash.com/photo-1450101499163-c8848c66ca85"
                        name="Corporate Filing #89"
                        message="Deadline update"
                        timestamp="Yesterday"
                    />
                    <ChatList.ChatListItem
                        avatar="https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0"
                        name="IP Rights #112"
                        message="Patent application status"
                        timestamp="2d ago"
                    />
                    </ChatList>
                </div>
            </div>
            <div className="flex flex-1 flex-col items-start self-stretch bg-legal-background">
                <ChatHeader
                    name="Rahul Mehta"
                    subtitle="Senior Partner • Property Law"
                    buttons={
                    <>
                        <IconButton
                            variant="brand-tertiary"
                            icon={<Paperclip className="w-4 h-4" />}
                        />
                        <IconButton
                            variant="brand-tertiary"
                            icon={<Phone className="w-4 h-4" />}
                        />
                    </>
                    }
                />
                <div className="w-full flex-1 overflow-auto">
                    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-4 px-4 py-8">
                    <TimelineDivider>Yesterday</TimelineDivider>
                    <ChatReceived
                        avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
                        initials="RM"
                        name="Rahul Mehta"
                        message="Hi, I've reviewed the property documents for case #45. There are a few concerns we need to address."
                        time="2:30 PM"
                    />
                    <ChatSent
                        name="You"
                        message="Could you highlight the specific areas that need attention?"
                        timestamp="2:35 PM"
                    />
                    <ChatReceived
                        avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
                        initials="RM"
                        name="Rahul Mehta"
                        message="Here's the annotated version of the agreement. The highlighted sections require immediate review."
                        time="2:45 PM"
                    />
                    <TimelineDivider>Today</TimelineDivider>
                    <ChatSent
                        name="You"
                        message="I'll review these sections and prepare the necessary amendments. Should we schedule a call to discuss?"
                        timestamp="9:15 AM"
                    />
                    <ChatReceived
                        avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
                        initials="RM"
                        name="Rahul Mehta"
                        message="Yes, that would be helpful. Are you available at 2 PM today?"
                        time="9:20 AM"
                    />
                    </div>
                </div>
                <div className="flex w-full items-center gap-4 border-t border-gray-200 bg-white px-6 py-3">
                    <IconButton
                        variant="brand-tertiary"
                        icon={<Paperclip className="w-5 h-5" />}
                    />
                    <TextFieldUnstyled className="flex-1">
                    <TextFieldUnstyled.Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    </TextFieldUnstyled>
                    <IconButton
                        variant="brand-primary"
                        icon={<Send className="w-5 h-5" />}
                    />
                </div>
            </div>
        </div>
        </DefaultPageLayout>
    );
};

export default Messages;
