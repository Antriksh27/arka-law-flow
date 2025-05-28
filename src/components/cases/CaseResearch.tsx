
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, BookOpen, Search, Lightbulb, FileText } from 'lucide-react';

interface CaseResearchProps {
  caseId: string;
}

export const CaseResearch: React.FC<CaseResearchProps> = ({ caseId }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'ai',
      message: 'Hello! I\'m your AI research assistant. I can help you research legal precedents, case laws, and provide insights related to your case. How can I assist you today?',
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: chatHistory.length + 1,
      type: 'user',
      message: message,
      timestamp: new Date()
    };

    // Mock AI response
    const aiResponse = {
      id: chatHistory.length + 2,
      type: 'ai',
      message: 'I understand you want to research this topic. Based on your case details, I can provide relevant legal precedents and case laws. Let me analyze the information and get back to you with specific recommendations.',
      timestamp: new Date()
    };

    setChatHistory([...chatHistory, userMessage, aiResponse]);
    setMessage('');
  };

  const suggestedQueries = [
    'Find similar cases with precedents',
    'Research relevant case laws',
    'Analyze legal arguments',
    'Find supporting evidence'
  ];

  return (
    <div className="space-y-6">
      {/* AI Research Assistant Header */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Bot className="w-5 h-5" />
            AI Research Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Get intelligent insights, legal precedents, and research assistance tailored to your case.
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="cursor-pointer hover:bg-gray-100 text-gray-700 border-gray-300"
                onClick={() => setMessage(query)}
              >
                {query}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Research Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        chat.type === 'user'
                          ? 'bg-gray-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{chat.message}</p>
                      <p className={`text-xs mt-1 ${
                        chat.type === 'user' ? 'text-gray-100' : 'text-gray-500'
                      }`}>
                        {chat.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about your case research..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Research Tools Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4" />
                Quick Research
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Case Precedents
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Search className="w-4 h-4 mr-2" />
                Legal Database
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Lightbulb className="w-4 h-4 mr-2" />
                AI Insights
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Research Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Ask specific questions about your case</li>
                <li>• Reference case numbers for precedent research</li>
                <li>• Request legal argument analysis</li>
                <li>• Ask for citation formatting help</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
