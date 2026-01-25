import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, Mail, Phone, MapPin, Building, Calendar, 
  FileText, CheckSquare, StickyNote, Edit, UserPlus, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EditContactDialog } from './EditContactDialog';
import { ConvertToClientDialog } from './ConvertToClientDialog';
import { DeleteContactDialog } from './DeleteContactDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { border, text } from '@/lib/colors';

interface ContactOverviewProps {
  contactId: string;
  contact: any;
  onUpdate: () => void;
}

export const ContactOverview: React.FC<ContactOverviewProps> = ({ contactId, contact, onUpdate }) => {
  const isMobile = useIsMobile();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch activity counts
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['contact-stats', contactId],
    queryFn: async (): Promise<{ notes: number; tasks: number; documents: number }> => {
      const notesResult = await (supabase.from('notes_v2' as any).select('id', { count: 'exact', head: true }).eq('contact_id', contactId));
      const tasksResult = await (supabase.from('tasks' as any).select('id', { count: 'exact', head: true }).eq('contact_id', contactId));
      const documentsResult = await (supabase.from('documents' as any).select('id', { count: 'exact', head: true }).eq('contact_id', contactId));
      
      return {
        notes: (notesResult as any).count || 0,
        tasks: (tasksResult as any).count || 0,
        documents: (documentsResult as any).count || 0
      };
    }
  });

  const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | undefined }) => {
    if (!value) return null;
    return (
      <div className={`flex items-start gap-3 ${isMobile ? 'p-3 bg-white rounded-xl' : ''}`}>
        <div className={`${isMobile ? 'p-2 bg-background rounded-lg' : ''}`}>
          <Icon className={`w-5 h-5 ${isMobile ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-foreground break-words`}>{value}</p>
        </div>
      </div>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statsLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              <div className="bg-card rounded-2xl border border-border p-3 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-blue-50 rounded-xl mb-2">
                    <StickyNote className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xl font-semibold text-foreground">{stats?.notes || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Notes</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-3 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-green-50 rounded-xl mb-2">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-xl font-semibold text-foreground">{stats?.tasks || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tasks</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-3 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-purple-50 rounded-xl mb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-xl font-semibold text-foreground">{stats?.documents || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Docs</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
          </div>
          <div className="p-4 space-y-3">
            <InfoItem icon={User} label="Full Name" value={contact.name} />
            <InfoItem icon={Mail} label="Email" value={contact.email} />
            <InfoItem icon={Phone} label="Phone" value={contact.phone} />
            <InfoItem icon={Building} label="Organization" value={contact.organization} />
            <InfoItem 
              icon={MapPin} 
              label="Address" 
              value={[contact.address, contact.city, contact.districts?.name, contact.states?.name, contact.pincode]
                .filter(Boolean)
                .join(', ') || undefined} 
            />
            <InfoItem 
              icon={Calendar} 
              label="Created" 
              value={contact.created_at ? format(new Date(contact.created_at), 'dd MMM yyyy') : undefined} 
            />
          </div>

          {contact.notes && (
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 min-h-[48px] rounded-xl"
              onClick={() => setShowEditDialog(true)}
            >
              <div className="p-1.5 bg-muted rounded-lg">
                <Edit className="w-4 h-4 text-foreground" />
              </div>
              Edit Contact
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 min-h-[48px] rounded-xl text-green-700 border-green-200 hover:bg-green-50"
              onClick={() => setShowConvertDialog(true)}
            >
              <div className="p-1.5 bg-green-50 rounded-lg">
                <UserPlus className="w-4 h-4 text-green-600" />
              </div>
              Convert to Client
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 min-h-[48px] rounded-xl text-red-700 border-red-200 hover:bg-red-50"
              onClick={() => setShowDeleteDialog(true)}
            >
              <div className="p-1.5 bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Contact
            </Button>
          </div>
        </div>

        {/* Dialogs */}
        <EditContactDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          contact={contact}
        />
        <ConvertToClientDialog
          open={showConvertDialog}
          onOpenChange={setShowConvertDialog}
          contact={contact}
        />
        <DeleteContactDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          contact={contact}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <StickyNote className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className={`text-2xl font-semibold ${text.primary}`}>{stats?.notes || 0}</p>
              <p className={`text-xs ${text.light}`}>Notes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className={`text-2xl font-semibold ${text.primary}`}>{stats?.tasks || 0}</p>
              <p className={`text-xs ${text.light}`}>Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className={`text-2xl font-semibold ${text.primary}`}>{stats?.documents || 0}</p>
              <p className={`text-xs ${text.light}`}>Documents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={User} label="Full Name" value={contact.name} />
            <InfoItem icon={Mail} label="Email" value={contact.email} />
            <InfoItem icon={Phone} label="Phone" value={contact.phone} />
            <InfoItem icon={Building} label="Organization" value={contact.organization} />
            <InfoItem 
              icon={MapPin} 
              label="Address" 
              value={[contact.address, contact.city, contact.districts?.name, contact.states?.name, contact.pincode]
                .filter(Boolean)
                .join(', ') || undefined} 
            />
            <InfoItem 
              icon={Calendar} 
              label="Created" 
              value={contact.created_at ? format(new Date(contact.created_at), 'dd MMM yyyy') : undefined} 
            />
          </div>

          {contact.notes && (
            <div className={`pt-4 border-t ${border.light}`}>
              <p className={`text-xs ${text.light} mb-2`}>Notes</p>
              <p className={`text-sm ${text.muted} whitespace-pre-wrap`}>{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="w-4 h-4" />
              Edit Contact
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => setShowConvertDialog(true)}
            >
              <UserPlus className="w-4 h-4" />
              Convert to Client
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditContactDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        contact={contact}
      />
      <ConvertToClientDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        contact={contact}
      />
      <DeleteContactDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        contact={contact}
      />
    </div>
  );
};
