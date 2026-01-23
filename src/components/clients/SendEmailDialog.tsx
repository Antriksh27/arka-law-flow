import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Paperclip, X, Mail, User, FileText } from 'lucide-react';
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

  React.useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setBody(defaultBody);

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
    const maxSize = 10 * 1024 * 1024;

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

      const { error } = await supabase.functions.invoke('send-client-email', {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Send Email</h2>
                  <p className="text-sm text-muted-foreground">To {clientName}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Recipient Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Recipient</p>
                    <p className="text-xs text-muted-foreground">Email address</p>
                  </div>
                </div>
                <Input 
                  value={clientEmail || ''} 
                  disabled 
                  className="bg-slate-100 border-slate-200 rounded-xl h-11 font-medium" 
                />
              </div>
            </div>

            {/* CC/BCC Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">CC (Optional)</Label>
                  <Input 
                    placeholder="email1@example.com, email2@example.com" 
                    value={cc} 
                    onChange={e => setCc(e.target.value)} 
                    disabled={isSending}
                    className="mt-1.5 bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">BCC (Optional)</Label>
                  <Input 
                    placeholder="email1@example.com, email2@example.com" 
                    value={bcc} 
                    onChange={e => setBcc(e.target.value)} 
                    disabled={isSending}
                    className="mt-1.5 bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                </div>
              </div>
            </div>

            {/* Subject & Message Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Message</p>
                    <p className="text-xs text-muted-foreground">Subject and body</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Subject *</Label>
                    <Input 
                      placeholder="Enter email subject" 
                      value={subject} 
                      onChange={e => setSubject(e.target.value)} 
                      disabled={isSending}
                      className="mt-1.5 bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Message *</Label>
                    <Textarea 
                      placeholder="Enter your message" 
                      value={body} 
                      onChange={e => setBody(e.target.value)} 
                      disabled={isSending} 
                      rows={6}
                      className="mt-1.5 bg-slate-50 border-slate-200 rounded-xl resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Paperclip className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Attachments</p>
                    <p className="text-xs text-muted-foreground">Optional files</p>
                  </div>
                </div>
                
                <Input 
                  id="attachments" 
                  type="file" 
                  multiple 
                  onChange={handleFileChange} 
                  disabled={isSending} 
                  className="hidden" 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('attachments')?.click()} 
                  disabled={isSending} 
                  className="w-full rounded-xl border-slate-200"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
                
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeAttachment(index)} 
                          disabled={isSending}
                          className="rounded-full h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isSending}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={isSending}
                className="flex-1 rounded-full bg-slate-800 hover:bg-slate-700"
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
