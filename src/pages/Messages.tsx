
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MessagesSidebar } from "@/components/messages/MessagesSidebar";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { useAuth } from "@/contexts/AuthContext";

// Messaging state: thread selection
const Messages = () => {
  const { user } = useAuth();
  const [selectedThread, setSelectedThread] = useState<
    { type: "dm"; userId: string; name: string } | { type: "case"; caseId: string; title: string } | null
  >(null);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto p-0 h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-y-auto p-4">
          <MessagesSidebar
            currentUserId={user?.id}
            selectedThread={selectedThread}
            onSelectThread={setSelectedThread}
          />
        </div>
        {/* Main Chat */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">
          {selectedThread ? (
            <ChatWindow
              selectedThread={selectedThread}
              currentUserId={user?.id}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400 text-lg">
              Select a direct message or case channel to start chatting.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
