
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, User, Mail, Phone, Building2, Calendar, Briefcase, MapPin, X } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">{client.full_name}</h2>
                    {client.is_vip && (
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getStatusColor(client.status)} border-0 rounded-full px-2.5 py-0.5 text-xs font-medium`}>
                      {client.status === 'new' ? 'New' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onOpenChange(false)}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Contact Information</p>
                    <p className="text-xs text-muted-foreground">Email & phone details</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-slate-900">{client.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{client.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization */}
            {client.organization && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Organization</p>
                      <p className="text-sm font-semibold text-slate-900">{client.organization}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Case Information */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Case Information</p>
                    <p className="text-xs text-muted-foreground">Assigned lawyer & active cases</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-xs text-muted-foreground mb-1">Assigned Lawyer</p>
                    <p className="text-sm font-medium text-slate-900">{client.assigned_lawyer_name || 'Not assigned'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
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
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client Since</p>
                    <p className="text-sm font-semibold text-slate-900">{TimeUtils.formatDate(client.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full rounded-full bg-slate-800 hover:bg-slate-700"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
