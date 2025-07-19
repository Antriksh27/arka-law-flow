import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Bot, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'instruction-created';
  content: string;
  timestamp: Date;
  metadata?: {
    staffMember?: string;
    priority?: string;
    deadline?: string;
    caseId?: string;
    instructionId?: string;
  };
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}

interface Case {
  id: string;
  case_title: string;
}

const InstructionsChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm here to help you create and send instructions to your staff. You can tell me what you need done, and I'll help you format it properly. For example, you can say: 'Ask John to review the Smith case documents by Friday'",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load staff members and cases
  useEffect(() => {
    loadStaffMembers();
    loadCases();
  }, []);

  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          role
        `)
        .in('role', ['office_staff', 'paralegal', 'junior']);

      if (error) throw error;

      // Get profile data separately
      const userIds = data?.map(member => member.user_id) || [];
      if (userIds.length === 0) return;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const formattedStaff = data
        ?.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id);
          return profile ? {
            id: profile.id,
            full_name: profile.full_name,
            role: member.role
          } : null;
        })
        .filter(Boolean) as StaffMember[] || [];

      setStaffMembers(formattedStaff);
    } catch (error) {
      console.error('Error loading staff members:', error);
    }
  };

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .limit(50);

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const parseInstruction = (message: string) => {
    // Simple parsing logic - in a real app, you might use NLP or AI
    const lowerMessage = message.toLowerCase();
    
    // Extract staff member
    const staffMember = staffMembers.find(staff => 
      lowerMessage.includes(staff.full_name.toLowerCase()) ||
      lowerMessage.includes(staff.full_name.split(' ')[0].toLowerCase())
    );

    // Extract priority
    let priority = 'medium';
    if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('immediately')) {
      priority = 'urgent';
    } else if (lowerMessage.includes('high priority') || lowerMessage.includes('important')) {
      priority = 'high';
    } else if (lowerMessage.includes('low priority') || lowerMessage.includes('when you can')) {
      priority = 'low';
    }

    // Extract and convert deadline to actual date
    let deadline = '';
    let deadlineDate: Date | null = null;
    
    const now = new Date();
    
    // Check for specific day names
    if (lowerMessage.includes('by monday') || lowerMessage.includes('by next monday')) {
      deadlineDate = getNextWeekday(now, 1); // Monday
      deadline = 'Monday';
    } else if (lowerMessage.includes('by tuesday') || lowerMessage.includes('by next tuesday')) {
      deadlineDate = getNextWeekday(now, 2); // Tuesday
      deadline = 'Tuesday';
    } else if (lowerMessage.includes('by wednesday') || lowerMessage.includes('by next wednesday')) {
      deadlineDate = getNextWeekday(now, 3); // Wednesday
      deadline = 'Wednesday';
    } else if (lowerMessage.includes('by thursday') || lowerMessage.includes('by next thursday')) {
      deadlineDate = getNextWeekday(now, 4); // Thursday
      deadline = 'Thursday';
    } else if (lowerMessage.includes('by friday') || lowerMessage.includes('by next friday')) {
      deadlineDate = getNextWeekday(now, 5); // Friday
      deadline = 'Friday';
    } else if (lowerMessage.includes('by end of week') || lowerMessage.includes('end of week')) {
      deadlineDate = getNextWeekday(now, 5); // Friday
      deadline = 'End of week';
    } else if (lowerMessage.includes('by tomorrow') || lowerMessage.includes('tomorrow')) {
      deadlineDate = new Date(now);
      deadlineDate.setDate(deadlineDate.getDate() + 1);
      deadline = 'Tomorrow';
    } else if (lowerMessage.includes('today')) {
      deadlineDate = new Date(now);
      deadline = 'Today';
    }

    // Helper function to get next occurrence of a weekday
    function getNextWeekday(date: Date, targetDay: number): Date {
      const result = new Date(date);
      const currentDay = result.getDay();
      const daysUntilTarget = targetDay - currentDay;
      const daysToAdd = daysUntilTarget <= 0 ? daysUntilTarget + 7 : daysUntilTarget;
      result.setDate(result.getDate() + daysToAdd);
      return result;
    }

    // Extract case reference
    const caseRef = cases.find(c => 
      lowerMessage.includes(c.case_title.toLowerCase()) ||
      lowerMessage.includes(c.case_title.split(' ')[0].toLowerCase())
    );

    return {
      staffMember,
      priority,
      deadline,
      deadlineDate,
      caseRef,
      cleanMessage: message
    };
  };

  const createInstruction = async (parsedData: any) => {
    try {
      const { data, error } = await supabase
        .from('instructions')
        .insert({
          lawyer_id: user?.id,
          staff_id: parsedData.staffMember?.id,
          case_id: parsedData.caseRef?.id,
          message: parsedData.cleanMessage,
          priority: parsedData.priority,
          deadline: parsedData.deadlineDate ? parsedData.deadlineDate.toISOString().split('T')[0] : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating instruction:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Parse the instruction
      const parsedData = parseInstruction(inputMessage);

      // Create assistant response
      let assistantResponse = '';
      let instructionId = '';

      if (parsedData.staffMember) {
        // Create the instruction
        const instruction = await createInstruction(parsedData);
        instructionId = instruction.id;

        assistantResponse = `✅ Instruction sent to ${parsedData.staffMember.full_name}!\n\n`;
        assistantResponse += `**Task:** ${parsedData.cleanMessage}\n`;
        assistantResponse += `**Priority:** ${parsedData.priority.charAt(0).toUpperCase() + parsedData.priority.slice(1)}\n`;
        if (parsedData.deadline) {
          assistantResponse += `**Deadline:** ${parsedData.deadline}\n`;
        }
        if (parsedData.caseRef) {
          assistantResponse += `**Related Case:** ${parsedData.caseRef.case_title}\n`;
        }
        assistantResponse += `\nThe staff member will be notified and can update the status through their dashboard.`;
      } else {
        assistantResponse = `I understood your request: "${inputMessage}"\n\nHowever, I couldn't identify which staff member to assign this to. Please specify a staff member's name, or I can show you available staff members. You can also be more specific about:\n\n• Who should handle this task\n• Priority level (urgent, high, medium, low)\n• Deadline if any\n• Related case if applicable`;
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        type: parsedData.staffMember ? 'instruction-created' : 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
        metadata: {
          staffMember: parsedData.staffMember?.full_name,
          priority: parsedData.priority,
          deadline: parsedData.deadline,
          caseId: parsedData.caseRef?.id,
          instructionId,
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (parsedData.staffMember) {
        toast({
          title: "Instruction Sent",
          description: `Task assigned to ${parsedData.staffMember.full_name}`,
        });
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        type: 'assistant',
        content: "Sorry, I encountered an error while creating the instruction. Please try again or create the instruction manually.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to create instruction",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const showStaffList = () => {
    const staffListMessage: ChatMessage = {
      id: Date.now().toString() + '_staff_list',
      type: 'assistant',
      content: `Here are your available staff members:\n\n${staffMembers.map(staff => 
        `• **${staff.full_name}** (${staff.role.replace('_', ' ')})`
      ).join('\n')}\n\nYou can mention their name in your instruction to assign tasks to them.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, staffListMessage]);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Instructions Assistant
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={showStaffList}>
            Show Staff
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const exampleMessage: ChatMessage = {
              id: Date.now().toString() + '_example',
              type: 'assistant',
              content: "Here are some example instructions you can try:\n\n• \"Ask Sarah to review the Johnson contract by Friday\"\n• \"Have Mike prepare the court filing for the Smith case - urgent\"\n• \"Can you ask Lisa to organize the client documents when she has time?\"\n• \"Tell John to schedule a meeting with the client by end of week\"",
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, exampleMessage]);
          }}>
            Examples
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-0">
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type !== 'user' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback>
                      {message.type === 'instruction-created' ? <CheckCircle2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.type === 'instruction-created'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    
                    {message.metadata && (
                      <div className="flex flex-wrap gap-1 mt-2">
                         {message.metadata.priority && (
                           <Badge variant={
                             message.metadata.priority === 'urgent' ? 'error' :
                             message.metadata.priority === 'high' ? 'default' : 'outline'
                           }>
                             {message.metadata.priority}
                           </Badge>
                         )}
                        {message.metadata.deadline && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {message.metadata.deadline}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1 px-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-6 pt-0">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your instruction... (e.g., 'Ask John to review the Smith case by Friday')"
              disabled={isProcessing}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isProcessing}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            Tip: Mention staff names, priority levels, and deadlines in your message
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstructionsChat;