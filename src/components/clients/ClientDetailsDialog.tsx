
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, User, Mail, Phone, Building2, Calendar, Briefcase, MapPin, X } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'new';
  organization?: string;
  assigned_lawyer_name?: string;
  active_case_count: number;
  created_at: string;
  is_vip?: boolean;
}

interface ClientDetailsDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClientDetailsDialog: React.FC<ClientDetailsDialogProps> = ({
  client,
  open,
  onOpenChange,
}) => {
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const isMobile = useIsMobile();
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);
  const getStatusBadgeVariant = (status: string): "default" | "outline" | "success" | "error" | "warning" => {
    switch (status) {
      case 'active': return 'success';
      case 'new': return 'default';
      case 'inactive': return 'outline';
      case 'lead': return 'warning';
      case 'prospect': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'inactive': return 'bg-slate-100 text-slate-700';
      case 'lead': return 'bg-amber-100 text-amber-700';
      case 'prospect': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col h-full bg-muted">
          {/* Header */}
            <MobileDialogHeader
              title={client.full_name}
              subtitle={client.status.charAt(0).toUpperCase() + client.status.slice(1) + (client.is_vip ? ' • VIP' : '')}
              onClose={handleClose}
              icon={
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center relative">
                  <User className="w-5 h-5 text-violet-600" />
                  {client.is_vip && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>
              }
              showBorder
            />

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Contact Information */}
            <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Contact Information</p>
                    <p className="text-xs text-muted-foreground">Email & phone details</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{client.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground">{client.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization */}
            {client.organization && (
              <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Organization</p>
                      <p className="text-sm font-semibold text-foreground">{client.organization}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Case Information */}
            <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Case Information</p>
                    <p className="text-xs text-muted-foreground">Assigned lawyer & active cases</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">Assigned Lawyer</p>
                    <p className="text-sm font-medium text-foreground">{client.assigned_lawyer_name || 'Not assigned'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">Active Cases</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                        {client.active_case_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client Since</p>
                    <p className="text-sm font-semibold text-foreground">{TimeUtils.formatDate(client.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-background border-t border-border">
            <Button 
              onClick={handleClose} 
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
