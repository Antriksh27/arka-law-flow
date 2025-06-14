
import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { FilePreview } from "./FilePreview";
import { ChatInput } from "./ChatInput";

// Thread type for prop
type Thread =
  | { type: "dm"; userId: string; name: string }
  | { type: "case"; caseId: string; title: string };

// Message type (without profiles field)
interface MessageWithProfile {
  id: string;
  sender_id: string;
  message_text: string;
  attachments?: any;
  created_at: string;
  [key: string]: any;
}

// User info for sender names
interface UserInfo {
  id: string;
  full_name: string;
}

interface ChatWindowProps {
  selectedThread: Thread;
  currentUserId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedThread,
  currentUserId,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Remove type parameter from useQuery to avoid deep type instantiation
  const { data, refetch, isFetching } = useQuery({
    queryKey: [
      "messages-thread",
      selectedThread.type,
      selectedThread.type === "dm"
        ? selectedThread.userId
        : selectedThread.caseId,
    ],
    queryFn: async () => {
      let query = supabase
        .from("messages")
        .select("id, sender_id, message_text, attachments, created_at")
        .order("created_at", { ascending: true });

      if (selectedThread.type === "dm") {
        query = query.or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedThread.userId}),and(sender_id.eq.${selectedThread.userId},receiver_id.eq.${currentUserId})`
        );
      } else if (selectedThread.type === "case") {
        query = query.eq("case_id", selectedThread.caseId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Now handle the cast safely after useQuery
  const messages: MessageWithProfile[] = Array.isArray(data) ? (data as MessageWithProfile[]) : [];

  // --- USER NAME MAP LOGIC ---
  // We keep a mapping of userId -> full_name for the current thread
  const [userNameMap, setUserNameMap] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    // Fetch full names for both users in DM, or all case participants
    async function fetchUserNames() {
      if (!messages || messages.length === 0) return setUserNameMap({});
      let userIds = Array.from(new Set(messages.map((m) => m.sender_id)));
      if (userIds.length === 0) return setUserNameMap({});

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (error || !Array.isArray(data)) {
        setUserNameMap({});
      } else {
        const map: { [id: string]: string } = {};
        for (let user of data) {
          if (user && user.id && user.full_name) {
            map[user.id] = user.full_name;
          }
        }
        setUserNameMap(map);
      }
    }
    fetchUserNames();
  }, [messages]);

  // Listen for new messages in real time via Supabase channel
  useEffect(() => {
    const channel = supabase
      .channel("messages_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          refetch();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    selectedThread.type,
    selectedThread.type === "dm"
      ? selectedThread.userId
      : selectedThread.caseId,
    refetch,
  ]);

  // Scroll to bottom on new messages
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Header label
  const headerLabel =
    selectedThread.type === "dm"
      ? selectedThread.name
      : selectedThread.title;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-100 min-h-16">
        <span className="text-lg font-semibold text-gray-900 truncate">
          {headerLabel}
        </span>
      </div>
      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background">
        {isFetching ? (
          <div className="text-center text-gray-400 mt-4">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg: MessageWithProfile) => {
            const isSender = msg.sender_id === currentUserId;
            const senderName =
              isSender
                ? "You"
                : userNameMap[msg.sender_id] ||
                  msg.sender_id?.slice(0, 8) ||
                  "User";
            return (
              <div
                key={msg.id}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-end gap-3 max-w-lg ${
                    isSender ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar - fallback only. Show initials if no name */}
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gray-100 text-xs">
                      {senderName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg px-4 py-2 shadow-sm mb-1 ${
                      isSender
                        ? "bg-blue-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {/* Show sender name */}
                    <div className="text-xs font-semibold text-primary mb-1">
                      {senderName}
                    </div>
                    <div className="whitespace-pre-line break-words">
                      {msg.message_text}
                    </div>
                    {/* File attachment preview */}
                    {msg.attachments &&
                      Array.isArray(msg.attachments) &&
                      msg.attachments.length > 0 && (
                        <div className="mt-2">
                          {msg.attachments.map((att: any, idx: number) => (
                            <FilePreview key={att.file_url || idx} fileUrl={att.file_url} />
                          ))}
                        </div>
                      )}
                    <div className="mt-1 text-xs text-muted-foreground text-right">
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {/* Message input */}
      <div className="border-t border-gray-100 p-6">
        <ChatInput selectedThread={selectedThread} />
      </div>
    </div>
  );
};
