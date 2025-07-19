import React from 'react';
import InstructionsChat from '@/components/instructions/InstructionsChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Clock, CheckCircle } from 'lucide-react';
const Instructions = () => {
  return <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Instructions</h1>
          <p className="text-gray-600">Send and manage instructions to your staff through our intelligent chat interface</p>
        </div>

        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <InstructionsChat />
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
                <CardDescription>
                  Tips for effective instruction management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">💬 Natural Language</h4>
                  <p className="text-sm text-gray-600">
                    Type instructions naturally: "Ask John to review the Smith case by Friday"
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">👥 Staff Names</h4>
                  <p className="text-sm text-gray-600">
                    Mention staff names directly in your message for automatic assignment
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">⚡ Priority Keywords</h4>
                  <p className="text-sm text-gray-600">
                    Use "urgent", "high priority", or "when you can" to set priority levels
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">📅 Deadlines</h4>
                  <p className="text-sm text-gray-600">
                    Specify deadlines with "by Friday", "by end of week", or specific dates
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">📁 Case References</h4>
                  <p className="text-sm text-gray-600">
                    Mention case names to automatically link instructions to cases
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <p className="font-medium">"Show staff"</p>
                  <p className="text-gray-600">View all available staff members</p>
                </div>
                
                <div className="text-sm space-y-1">
                  <p className="font-medium">"Examples"</p>
                  <p className="text-gray-600">See sample instruction formats</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>;
};
export default Instructions;