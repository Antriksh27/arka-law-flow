import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Minus } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "me" | "other";
}

interface ChatScreenProps {
  userName: string;
  userAvatar?: string;
  userOnline?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  userName,
  userAvatar,
  userOnline = false,
  onClose,
  onMinimize,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", content: "Hi there!", sender: "other" },
    { id: "2", content: "Hello 👋", sender: "me" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "me",
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  return (
    <Card className="w-full h-full flex flex-col rounded-2xl bg-card shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold overflow-hidden">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-full h-full rounded-full" />
          ) : (
            (userName?.charAt(0) || "U")
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">{userName}</p>
          {userOnline && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {onMinimize && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMinimize}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-muted/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.sender === "me" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "other" && (
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-foreground text-xs font-medium">
                {userName?.charAt(0) || "U"}
              </div>
            )}

            <div
              className={`px-3 py-2 rounded-2xl text-sm max-w-xs break-words transition-all duration-200 ${
                msg.sender === "me"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card text-foreground shadow-sm border border-border rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>

            {msg.sender === "me" && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                M
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2 bg-card">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          className="flex-1 rounded-full"
        />
        <Button
          onClick={sendMessage}
          size="icon"
          className="shrink-0 rounded-full"
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ChatScreen;
