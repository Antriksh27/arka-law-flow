import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Building, Briefcase, Users, Calendar, UserCheck, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
interface ClientInformationProps {
  clientId: string;
}
export const ClientInformation: React.FC<ClientInformationProps> = ({
  clientId
}) => {
  const {
    data: client,
    isLoading
  } = useQuery({
    queryKey: ['client-full-info', clientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch primary assigned lawyer
  const {
    data: primaryLawyer
  } = useQuery({
    queryKey: ['client-primary-lawyer', client?.assigned_lawyer_id],
    queryFn: async () => {
      if (!client?.assigned_lawyer_id) return null;
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, full_name, profile_pic').eq('id', client.assigned_lawyer_id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!client?.assigned_lawyer_id
  });

  // Fetch additional assigned lawyers
  const {
    data: assignedLawyers = []
  } = useQuery({
    queryKey: ['client-assigned-lawyers', clientId],
    queryFn: async () => {
      const {
        data: assignments
      } = await supabase.from('client_lawyer_assignments').select(`
          id,
          lawyer_id,
          assigned_at,
          profiles:lawyer_id (
            id,
            full_name,
            profile_pic
          )
        `).eq('client_id', clientId);
      return assignments || [];
    }
  });
  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>;
  }
  if (!client) {
    return <div className="text-center py-12 text-gray-500">
        Client information not found
      </div>;
  }
  const InfoRow = ({
    icon: Icon,
    label,
    value
  }: {
    icon: any;
    label: string;
    value: string | null | undefined;
  }) => {
    return <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
        <div className="flex-1">
          <span className="text-sm text-gray-600">{label}: </span>
          <span className={`text-sm ${value ? 'font-medium text-gray-900' : 'italic text-gray-400'}`}>
            {value || 'Not provided'}
          </span>
        </div>
      </div>;
  };
  return <div className="space-y-6">
      {/* Personal Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <CardTitle>Personal Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={User} label="Full Name" value={client.full_name} />
          <InfoRow icon={Mail} label="Email" value={client.email} />
          <InfoRow icon={Phone} label="Phone" value={client.phone} />
          <InfoRow icon={UserCheck} label="Client Type" value={client.type} />
          
          
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <CardTitle>Address Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={MapPin} label="Address" value={client.address} />
          <InfoRow icon={MapPin} label="District" value={client.district} />
          <InfoRow icon={MapPin} label="State" value={client.state} />
          <InfoRow icon={MapPin} label="PIN Code" value={client.pin_code} />
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <CardTitle>Professional Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Building} label="Organization" value={client.organization} />
          <InfoRow icon={Briefcase} label="Designation" value={client.designation} />
          <InfoRow icon={MapPin} label="Company Address" value={client.company_address} />
          <InfoRow icon={Phone} label="Company Phone" value={client.company_phone} />
          <InfoRow icon={Mail} label="Company Email" value={client.company_email} />
        </CardContent>
      </Card>

      {/* Reference Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <CardTitle>Reference Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Users} label="Referred By" value={client.referred_by_name} />
          <InfoRow icon={Phone} label="Reference Phone" value={client.referred_by_phone} />
        </CardContent>
      </Card>

      {/* Additional Notes */}
      

      {/* Services */}
      

      {/* Assigned Lawyers */}
      

      {/* Notes */}

      {/* Financial Details */}
      

      {/* Account Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <CardTitle>Account Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Calendar} label="Created Date" value={TimeUtils.formatDate(client.created_at)} />
          <InfoRow icon={Calendar} label="Last Edited Date" value={TimeUtils.formatDate(client.updated_at)} />
        </CardContent>
      </Card>
    </div>;
};