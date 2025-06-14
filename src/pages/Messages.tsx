
import React, { useState, useMemo } from "react";
import DefaultPageLayout from "@/components/messages/ui/DefaultPageLayout";
import { Edit, Search, Paperclip, Phone, Send } from "lucide-react";
import { IconButton } from "@/components/messages/ui/IconButton";
import { TextField } from "@/components/messages/ui/TextField";
import { MessagesSidebar } from "@/components/messages/MessagesSidebar";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { useAuth } from "@/contexts/AuthContext";

const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedThread, setSelectedThread] = useState<
    | { type: "dm"; userId: string; name: string }
    | { type: "case"; caseId: string; title: string }
    | null
  >(null);

  // Memoize user id for stable identity
  const currentUserId = useMemo(() => user?.id ?? "", [user?.id]);

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
              icon={<Edit size={18} />}
              onClick={() => {}}
            />
          </div>
          <TextField
            className="h-auto w-full flex-none mt-2"
            variant="filled"
            label=""
            helpText=""
            icon={<Search size={16} />}
          >
            <TextField.Input
              placeholder="Search users or cases"
              value=""
              onChange={() => {}}
            />
          </TextField>

          {/* Real Data Sidebar */}
          <div className="flex w-full grow flex-col items-start gap-4 overflow-auto mt-4">
            <MessagesSidebar
              selectedThread={selectedThread}
              onSelectThread={setSelectedThread}
              currentUserId={currentUserId}
            />
          </div>
        </div>
        <div className="flex grow flex-col items-start self-stretch">
          {selectedThread ? (
            <ChatWindow selectedThread={selectedThread} currentUserId={currentUserId} />
          ) : (
            <div className="flex flex-1 w-full items-center justify-center text-gray-400 text-lg">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </DefaultPageLayout>
  );
};

export default MessagesPage;
