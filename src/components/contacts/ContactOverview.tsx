import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const { data: stats } = useQuery({
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
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm text-gray-900">{value}</p>
        </div>
      </div>
    );
  };

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
              <p className="text-2xl font-semibold text-gray-900">{stats?.notes || 0}</p>
              <p className="text-xs text-gray-500">Notes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.tasks || 0}</p>
              <p className="text-xs text-gray-500">Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.documents || 0}</p>
              <p className="text-xs text-gray-500">Documents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={isMobile ? "text-base font-semibold" : "text-xl font-semibold"}>
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
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className={isMobile ? "text-base font-semibold" : "text-xl font-semibold"}>
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
