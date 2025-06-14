
import React, { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { FilePreview } from "./FilePreview";
import { ChatInput } from "./ChatInput";

// Define thread type again for prop
type Thread =
  | { type: "dm"; userId: string; name: string }
  | { type: "case"; caseId: string; title: string };

// ---- ADD TYPE HERE ----
interface MessageWithProfile {
  id: string;
  sender_id: string;
  message_text: string;
  file_url?: string | null;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    profile_pic?: string | null;
  };
  // Allow any additional keys for forward compatibility
  [key: string]: any;
}
// ---- END TYPE ----

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

  // Fetch the messages for the selected thread
  const {
    data: messages = [],
    refetch,
    isFetching,
  } = useQuery< MessageWithProfile[] >({
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
        .select(
          "id, sender_id, message_text, file_url, created_at, profiles:sender_id(full_name, profile_pic)"
        )
        .order("created_at", { ascending: true });

      if (selectedThread.type === "dm") {
        // Only show messages between both users (as sender or receiver)
        query = query.or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedThread.userId}),and(sender_id.eq.${selectedThread.userId},receiver_id.eq.${currentUserId})`
        );
      } else if (selectedThread.type === "case") {
        query = query.eq("case_id", selectedThread.caseId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

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
        (payload) => {
          // Only refetch if for selected thread
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

  // Header label (user or case)
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
          messages.map((msg) => {
            const isSender = msg.sender_id === currentUserId;
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
                  {/* Optional avatar for left/bottom bubble */}
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gray-100 text-xs">
                      {msg.profiles?.full_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg px-4 py-2 shadow-sm mb-1 ${
                      isSender
                        ? "bg-blue-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="whitespace-pre-line break-words">
                      {msg.message_text}
                    </div>
                    {msg.file_url && (
                      <div className="mt-2">
                        <FilePreview fileUrl={msg.file_url} />
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
