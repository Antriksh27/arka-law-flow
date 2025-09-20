import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditClientDialog } from './EditClientDialog';
import { EngagementLetterDialog } from './EngagementLetterDialog';
import { AddCaseDialog } from '../cases/AddCaseDialog';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Building, UserCheck, Users, Edit, Plus, FileText, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
interface ClientInfoSidebarProps {
  client: any;
  onUpdate: () => void;
}
export const ClientInfoSidebar: React.FC<ClientInfoSidebarProps> = ({
  client,
  onUpdate
}) => {
  const {
    firmId
  } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddCaseDialog, setShowAddCaseDialog] = useState(false);
  const [showEngagementLetterDialog, setShowEngagementLetterDialog] = useState(false);

  // Fetch assigned lawyers for this client
  const {
    data: assignedLawyers = []
  } = useQuery({
    queryKey: ['client-assigned-lawyers', client.id, firmId],
    queryFn: async () => {
      if (!firmId || !client.id) return [];
      const {
        data: assignments,
        error: assignmentError
      } = await supabase.from('client_lawyer_assignments').select('id, lawyer_id, assigned_at').eq('client_id', client.id).eq('firm_id', firmId);
      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return [];
      const lawyerIds = assignments.map(a => a.lawyer_id);
      const {
        data: teamMembers,
        error: teamError
      } = await supabase.from('team_members').select('user_id, full_name, role').eq('firm_id', firmId).in('user_id', lawyerIds);
      if (teamError) throw teamError;
      return assignments.map(assignment => {
        const teamMember = teamMembers?.find(tm => tm.user_id === assignment.lawyer_id);
        return {
          assignmentId: assignment.id,
          lawyerId: assignment.lawyer_id,
          fullName: teamMember?.full_name || 'Unknown',
          role: teamMember?.role || 'unknown',
          assignedAt: assignment.assigned_at
        };
      });
    },
    enabled: !!firmId && !!client.id
  });
  return <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowEditDialog(true)} className="flex-1 bg-primary hover:bg-primary/90 text-white">
              <Edit className="w-4 h-4 mr-2" />
              Edit Client
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddCaseDialog(true)} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add Case
            </Button>
          </div>
          
          <Button size="sm" variant="outline" onClick={() => setShowEngagementLetterDialog(true)} className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
            <FileText className="w-4 h-4 mr-2" />
            Engagement Letter
          </Button>
        </CardContent>
      </Card>

      {/* Client Details */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Litigant & Reference Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Litigant Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
              Litigant Name
            </h4>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">{client.full_name}</span>
            </div>
            
            {client.type && <div className="flex items-center gap-3 text-sm">
                <UserCheck className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-600">Type: </span>
                  <span className="text-gray-900">{client.type}</span>
                </div>
              </div>}
            
            {client.organization && <div className="flex items-center gap-3 text-sm">
                <Building className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-600">Organization: </span>
                  <span className="text-gray-900">{client.organization}</span>
                </div>
              </div>}

            {client.status && <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4"></div>
                <div>
                  <span className="text-gray-600">Status: </span>
                  <Badge variant={client.status === 'active' ? 'success' : 'outline'}>
                    {client.status}
                  </Badge>
                </div>
              </div>}
          </div>

          {/* Contact Information */}
          {(client.email || client.phone || client.address) && <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                Contact Information
              </h4>
              {client.email && <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{client.email}</span>
                </div>}
              {client.phone && <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{client.phone}</span>
                </div>}
              {client.address && <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{client.address}</span>
                </div>}
            </div>}

          {/* Reference Information */}
          {(client.referred_by_name || client.referred_by_phone || client.source) && <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                Reference Details
              </h4>
              {client.referred_by_name && <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Referred By: </span>
                    <span className="text-gray-900 font-medium">{client.referred_by_name}</span>
                  </div>
                </div>}
              {client.referred_by_phone && <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Reference Phone: </span>
                    <span className="text-gray-900">{client.referred_by_phone}</span>
                  </div>
                </div>}
              {client.source && <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Source: </span>
                    <span className="text-gray-900">{client.source}</span>
                  </div>
                </div>}
            </div>}


          {/* Assigned Lawyers */}
          {assignedLawyers.length > 0 && <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                Assigned Lawyers
              </h4>
              <div className="space-y-3">
                {assignedLawyers.map(lawyer => <div key={lawyer.assignmentId} className="flex items-center gap-3 text-sm">
                    <UserCog className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">{lawyer.fullName}</span>
                        <Badge variant="outline" className="text-xs">
                          {lawyer.role}
                        </Badge>
                      </div>
                      <span className="text-gray-500 text-xs">
                        Assigned {new Date(lawyer.assignedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>)}
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showEditDialog && <EditClientDialog open={showEditDialog} onOpenChange={setShowEditDialog} client={client} onSuccess={onUpdate} />}

      {showAddCaseDialog && <AddCaseDialog open={showAddCaseDialog} onClose={() => setShowAddCaseDialog(false)} preSelectedClientId={client.id} />}

      {showEngagementLetterDialog && <EngagementLetterDialog open={showEngagementLetterDialog} onClose={() => setShowEngagementLetterDialog(false)} clientId={client.id} clientName={client.full_name} />}
    </div>;
};