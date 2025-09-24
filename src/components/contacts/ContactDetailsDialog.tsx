import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Building, Mail, Phone, MapPin, FileText, Calendar, UserCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ContactDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

export const ContactDetailsDialog: React.FC<ContactDetailsDialogProps> = ({
  open,
  onOpenChange,
  contact
}) => {
  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium text-lg">
                {contact.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{contact.name}</h2>
              {contact.organization && (
                <p className="text-muted-foreground">{contact.organization}</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contact.email && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Organization Information */}
          {contact.organization && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <Building className="w-5 h-5" />
                  Organization
                </h3>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{contact.organization}</p>
                </div>
              </div>
            </>
          )}

          {/* Location Information */}
          {(contact.address_line_1 || contact.address_line_2 || contact.states?.name || contact.districts?.name || contact.pin_code) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <MapPin className="w-5 h-5" />
                  Location
                </h3>
                
                <div className="space-y-2">
                  {contact.address_line_1 && (
                    <p className="text-sm">{contact.address_line_1}</p>
                  )}
                  {contact.address_line_2 && (
                    <p className="text-sm">{contact.address_line_2}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {contact.districts?.name && (
                      <Badge variant="outline">{contact.districts.name}</Badge>
                    )}
                    {contact.states?.name && (
                      <Badge variant="outline">{contact.states.name}</Badge>
                    )}
                    {contact.pin_code && (
                      <Badge variant="outline">PIN: {contact.pin_code}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Visit Information */}
          <Separator />
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <Calendar className="w-5 h-5" />
              Visit Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contact.visit_purpose && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Purpose of Visit</p>
                  <Badge variant="outline">{contact.visit_purpose}</Badge>
                </div>
              )}
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Last Visit</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(contact.last_visited_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(contact.last_visited_at), 'PPP')}
                </p>
              </div>
            </div>
          </div>

          {/* Referral Information */}
          {(contact.referred_by_name || contact.referred_by_phone) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <UserCheck className="w-5 h-5" />
                  Referral Information
                </h3>
                
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  {contact.referred_by_name && (
                    <div>
                      <p className="text-sm font-medium">Referred By</p>
                      <p className="text-sm text-muted-foreground">{contact.referred_by_name}</p>
                    </div>
                  )}
                  {contact.referred_by_phone && (
                    <div>
                      <p className="text-sm font-medium">Referrer Phone</p>
                      <p className="text-sm text-muted-foreground">{contact.referred_by_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {contact.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <FileText className="w-5 h-5" />
                  Notes
                </h3>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p className="font-medium">Created</p>
              <p>{format(new Date(contact.created_at), 'PPP p')}</p>
            </div>
            {contact.updated_at && (
              <div>
                <p className="font-medium">Updated</p>
                <p>{format(new Date(contact.updated_at), 'PPP p')}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};