import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Paperclip, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  clientEmail: string;
  clientName: string;
  defaultSubject?: string;
  defaultBody?: string;
  pdfAttachment?: Blob;
  pdfFileName?: string;
}
export const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  open,
  onClose,
  clientEmail,
  clientName,
  defaultSubject = '',
  defaultBody = '',
  pdfAttachment,
  pdfFileName
}) => {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Update fields when defaults change
  React.useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setBody(defaultBody);

      // Add PDF as attachment if provided
      if (pdfAttachment && pdfFileName) {
        const pdfFile = new File([pdfAttachment], pdfFileName, {
          type: 'application/pdf'
        });
        setAttachments([pdfFile]);
      }
    }
  }, [open, defaultSubject, defaultBody, pdfAttachment, pdfFileName]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB per file

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
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
      // Convert attachments to base64
      const attachmentsData = await Promise.all(attachments.map(async file => {
        const base64 = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]);
          };
          reader.readAsDataURL(file);
        });
        return {
          filename: file.name,
          content: base64,
          type: file.type
        };
      }));
      const {
        error
      } = await supabase.functions.invoke('send-client-email', {
        body: {
          to: clientEmail,
          subject: subject.trim(),
          body: body.trim(),
          clientName,
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          attachments: attachmentsData.length > 0 ? attachmentsData : undefined
        }
      });
      if (error) throw error;
      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${clientName}`
      });
      setSubject('');
      setBody('');
      setCc('');
      setBcc('');
      setAttachments([]);
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
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] bg-white flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Send Email to {clientName}</DialogTitle>
          <DialogDescription>
            Compose and send an email to your client
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" value={clientEmail || ''} disabled className="bg-gray-100 text-gray-900 font-medium" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc">CC (Optional)</Label>
            <Input id="cc" placeholder="email1@example.com, email2@example.com" value={cc} onChange={e => setCc(e.target.value)} disabled={isSending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bcc">BCC (Optional)</Label>
            <Input id="bcc" placeholder="email1@example.com, email2@example.com" value={bcc} onChange={e => setBcc(e.target.value)} disabled={isSending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="Enter email subject" value={subject} onChange={e => setSubject(e.target.value)} disabled={isSending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" placeholder="Enter your message" value={body} onChange={e => setBody(e.target.value)} disabled={isSending} rows={8} className="resize-none" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input id="attachments" type="file" multiple onChange={handleFileChange} disabled={isSending} className="hidden" />
              <Button type="button" variant="outline" onClick={() => document.getElementById('attachments')?.click()} disabled={isSending} className="w-full">
                <Paperclip className="w-4 h-4 mr-2" />
                Attach Files
              </Button>
            </div>
            {attachments.length > 0 && <div className="space-y-2 mt-2">
                {attachments.map((file, index) => <div key={index} className="flex items-center justify-between p-2 rounded-md bg-slate-200">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)} disabled={isSending}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>)}
              </div>}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isSending ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </> : <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};