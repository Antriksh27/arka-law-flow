
import React from "react";
import DefaultPageLayout from "@/components/messages/ui/DefaultPageLayout";
import { FeatherEdit, FeatherSearch, FeatherPaperclip, FeatherPhone, FeatherSend } from "lucide-react";
import { IconButton } from "@/components/messages/ui/IconButton";
import { TextField } from "@/components/messages/ui/TextField";
import { ChatList } from "@/components/messages/ui/ChatList";
import { ChatHeader } from "@/components/messages/ui/ChatHeader";
import { TimelineDivider } from "@/components/messages/ui/TimelineDivider";
import { ChatReceived } from "@/components/messages/ui/ChatReceived";
import { ChatSent } from "@/components/messages/ui/ChatSent";
import { TextFieldUnstyled } from "@/components/messages/ui/TextFieldUnstyled";

const MessagesPage = () => {
  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full items-start bg-[#F9FAFB]">
        <div className="flex w-72 flex-none flex-col items-start gap-2 self-stretch border-r border-solid border-gray-200 bg-neutral-50 px-4 py-4 mobile:hidden">
          <div className="flex w-full items-center gap-4">
            <div className="flex grow shrink-0 basis-0 items-center gap-4">
              <span className="text-xl font-semibold text-gray-900">
                Messages
              </span>
            </div>
            <IconButton
              variant="brand-tertiary"
              icon={<FeatherEdit size={18} />}
              onClick={() => {}}
            />
          </div>
          <TextField
            className="h-auto w-full flex-none mt-2"
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch size={16} />}
          >
            <TextField.Input
              placeholder="Search users or cases"
              value=""
              onChange={() => {}}
            />
          </TextField>
          <div className="flex w-full grow flex-col items-start gap-4 overflow-auto mt-4">
            <span className="text-xs font-semibold text-muted-foreground">
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
            <span className="text-xs font-semibold text-muted-foreground">
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
        <div className="flex grow flex-col items-start self-stretch">
          <ChatHeader
            name="Rahul Mehta"
            subtitle="Senior Partner • Property Law"
            buttons={
              <>
                <IconButton
                  variant="brand-tertiary"
                  icon={<FeatherPaperclip size={18} />}
                  onClick={() => {}}
                />
                <IconButton
                  variant="brand-tertiary"
                  icon={<FeatherPhone size={18} />}
                  onClick={() => {}}
                />
              </>
            }
          />
          <div className="flex w-full grow flex-col items-center justify-end overflow-auto">
            <div className="container max-w-none flex w-full grow flex-col items-center gap-4 py-12 overflow-auto">
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
          <div className="flex w-full items-center gap-2 border-t border-solid border-gray-200 px-6 py-6">
            <IconButton
              variant="brand-tertiary"
              icon={<FeatherPaperclip size={18} />}
              onClick={() => {}}
            />
            <TextFieldUnstyled className="h-auto grow">
              <TextFieldUnstyled.Input
                placeholder="Type your message..."
                value=""
                onChange={() => {}}
              />
            </TextFieldUnstyled>
            <IconButton
              variant="brand-primary"
              icon={<FeatherSend size={18} />}
              onClick={() => {}}
            />
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
};

export default MessagesPage;
