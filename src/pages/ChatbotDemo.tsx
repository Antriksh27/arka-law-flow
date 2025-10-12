import ChatbotWidget from "@/components/ui/chatbot-widget";

const ChatbotDemo = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Chatbot Widget Demo</h1>
          <p className="text-muted-foreground">
            Click the floating button in the bottom right to open the chat
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 rounded-2xl border border-border bg-card">
            <h3 className="text-xl font-semibold mb-2">Features</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Floating widget in corner</li>
              <li>✓ Minimize to compact view</li>
              <li>✓ Close completely</li>
              <li>✓ Smooth animations</li>
              <li>✓ Responsive design</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card">
            <h3 className="text-xl font-semibold mb-2">Usage</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Click the button to open chat</li>
              <li>• Use minimize to collapse</li>
              <li>• Use close (X) to hide</li>
              <li>• Click minimized bar to expand</li>
            </ul>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-border bg-muted/30 text-center">
          <p className="text-lg text-muted-foreground">
            The chatbot widget is positioned in the bottom-right corner
          </p>
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget
        userName="Support Assistant"
        userOnline={true}
      />
    </div>
  );
};

export default ChatbotDemo;
