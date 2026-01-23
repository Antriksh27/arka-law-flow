import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Building, Mail, Phone, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeleteContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

export const DeleteContactDialog = ({ open, onOpenChange, contact }: DeleteContactDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const deleteContactMutation = useMutation({
    mutationFn: async () => {
      if (!contact?.id) {
        throw new Error('Contact ID is required');
      }

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) {
        console.error('Error deleting contact:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${contact.name} has been deleted successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'h-auto max-h-[90dvh] w-[95%] rounded-2xl' : 'sm:max-w-md'} p-0 gap-0 overflow-hidden`}>
        <div className="flex flex-col bg-slate-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Delete Contact</h2>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Contact Preview Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-lg">
                    {contact.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{contact.name}</h3>
                  {contact.organization && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Building className="h-3.5 w-3.5" />
                      {contact.organization}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {contact.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Warning Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800 text-sm">Warning</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This will permanently remove all contact information from your system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-full h-11"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteContactMutation.mutate()}
                disabled={deleteContactMutation.isPending}
                className="flex-1 rounded-full h-11"
              >
                {deleteContactMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Contact'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
