import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  clientEmail: string;
  clientName: string;
}

export const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  open,
  onClose,
  clientEmail,
  clientName
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-client-email', {
        body: {
          to: clientEmail,
          subject: subject.trim(),
          body: body.trim(),
          clientName
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${clientName}`
      });

      setSubject('');
      setBody('');
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle>Send Email to {clientName}</DialogTitle>
          <DialogDescription>
            Compose and send an email to your client
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={clientEmail || ''}
              disabled
              className="bg-gray-50 text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Enter your message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
              rows={8}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
