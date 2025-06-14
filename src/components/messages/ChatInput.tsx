
import React, { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Thread =
  | { type: "dm"; userId: string; name: string }
  | { type: "case"; caseId: string; title: string };

interface ChatInputProps {
  selectedThread: Thread;
}

export const ChatInput: React.FC<ChatInputProps> = ({ selectedThread }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !file) return;
    setUploading(true);
    let fileUrl: string | undefined = undefined;
    try {
      // Upload file if present
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large (max 10MB)",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
        const firmId =
          (await supabase
            .from("team_members")
            .select("firm_id")
            .eq("user_id", user?.id)
            .single()).data?.firm_id || "misc";
        const path = `messages/${firmId}/${user?.id}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from("message_attachments")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });
        if (error) {
          throw error;
        }
        // Generate public/download URL (if needed; access may be controlled via RLS)
        fileUrl = data ? data.path : undefined;
      }

      // Compose message payload
      const insertPayload: any = {
        sender_id: user?.id,
        message_text: message,
        firm_id:
          (await supabase
            .from("team_members")
            .select("firm_id")
            .eq("user_id", user?.id)
            .single()).data?.firm_id || null,
        file_url: fileUrl,
      };
      if (selectedThread.type === "dm") {
        insertPayload.receiver_id = selectedThread.userId;
      } else if (selectedThread.type === "case") {
        insertPayload.case_id = selectedThread.caseId;
      }
      const { error: msgError } = await supabase
        .from("messages")
        .insert([insertPayload]);
      if (msgError) throw msgError;
      setMessage("");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      toast({ title: "Failed to send message", variant: "destructive" });
      setUploading(false);
      return;
    }
    setUploading(false);
  };

  return (
    <form
      className="flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleSend();
      }}
    >
      <Input
        type="text"
        placeholder="Type a message…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1"
        disabled={uploading}
      />
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        ref={inputRef}
        id="message-file"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        disabled={uploading}
      />
      <label htmlFor="message-file">
        <Button
          asChild
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
        >
          <span>
            <Paperclip className="w-4 h-4" />
          </span>
        </Button>
      </label>
      <Button
        type="submit"
        className="bg-blue-700 hover:bg-blue-800"
        disabled={uploading || (!message.trim() && !file)}
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};
