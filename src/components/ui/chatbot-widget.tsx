import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatScreen from "@/components/ui/basic-chat";
import { cn } from "@/lib/utils";

interface ChatbotWidgetProps {
  userName?: string;
  userAvatar?: string;
  userOnline?: boolean;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  userName = "Support Assistant",
  userAvatar,
  userOnline = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50",
            "animate-fade-in hover:scale-110 transition-transform duration-200"
          )}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 transition-all duration-300 ease-in-out",
            "animate-scale-in",
            isMinimized
              ? "bottom-6 right-6 w-80 h-16"
              : "bottom-6 right-6 w-96 h-[600px]"
          )}
        >
          {isMinimized ? (
            // Minimized Bar
            <div
              onClick={handleMaximize}
              className="w-full h-full bg-card rounded-2xl shadow-2xl border border-border cursor-pointer hover:shadow-xl transition-shadow flex items-center gap-3 px-4"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  userName?.charAt(0) || "S"
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
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          ) : (
            // Full Chat
            <ChatScreen
              userName={userName}
              userAvatar={userAvatar}
              userOnline={userOnline}
              onClose={handleClose}
              onMinimize={handleMinimize}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
