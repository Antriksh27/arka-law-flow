
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

// Thread shape for selection
type SidebarThread =
  | { type: "dm"; userId: string; name: string }
  | { type: "case"; caseId: string; title: string };

interface MessagesSidebarProps {
  currentUserId?: string;
  selectedThread: SidebarThread | null;
  onSelectThread: (thread: SidebarThread) => void;
}

export const MessagesSidebar: React.FC<MessagesSidebarProps> = ({
  currentUserId,
  selectedThread,
  onSelectThread,
}) => {
  // Get firm users, except super_admin/client/self
  const { data: users = [] } = useQuery({
    queryKey: ["firm-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("user_id, full_name, role")
        .neq("user_id", currentUserId);
      if (error) throw error;
      // Exclude clients and super admins by role (role may be untyped, so use string check)
      return data.filter(
        // @ts-ignore
        (u) => u.role !== "client" && u.role !== "super_admin"
      );
    },
  });

  // List cases assigned to user (for group chat)
  const { data: cases = [] } = useQuery({
    queryKey: ["assigned-cases", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, assigned_to, assigned_users")
        .or(
          `assigned_to.eq.${currentUserId},assigned_users.cs.{${currentUserId}}`
        );
      if (error) throw error;
      // also: consider created_by or custom assignments
      return data;
    },
    enabled: !!currentUserId,
  });

  return (
    <div className="flex flex-col gap-8">
      {/* DMs */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">
          Direct Messages
        </h3>
        <div className="flex flex-col gap-1">
          {users.length === 0 && (
            <p className="text-xs text-gray-400">No other team members</p>
          )}
          {users.map((user: any) => (
            <button
              key={user.user_id}
              onClick={() =>
                onSelectThread({
                  type: "dm",
                  userId: user.user_id,
                  name: user.full_name,
                })
              }
              className={`flex gap-3 items-center text-left p-2 rounded-lg transition font-medium ${
                selectedThread?.type === "dm" &&
                selectedThread?.userId === user.user_id
                  ? "bg-blue-50 text-primary"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-gray-100 text-xs">
                  {user.full_name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") ?? "U"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{user.full_name}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Case channels */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">
          Case Channels
        </h3>
        <div className="flex flex-col gap-1">
          {cases.length === 0 && (
            <p className="text-xs text-gray-400">No assigned cases</p>
          )}
          {cases.map((caseItem: any) => (
            <button
              key={caseItem.id}
              onClick={() =>
                onSelectThread({
                  type: "case",
                  caseId: caseItem.id,
                  title: caseItem.title,
                })
              }
              className={`flex gap-3 items-center text-left p-2 rounded-lg transition font-medium ${
                selectedThread?.type === "case" &&
                selectedThread?.caseId === caseItem.id
                  ? "bg-blue-50 text-primary"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
            >
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span className="truncate">{caseItem.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
