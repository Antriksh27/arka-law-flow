import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, Phone, MapPin, Building, Briefcase, 
  Users, Calendar, FileText, UserCheck, CreditCard,
  Shield, Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ClientInformationProps {
  clientId: string;
}

export const ClientInformation: React.FC<ClientInformationProps> = ({ clientId }) => {
  const { data: client, isLoading } = useQuery({
    queryKey: ['client-full-info', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch assigned lawyers
  const { data: assignedLawyers = [] } = useQuery({
    queryKey: ['client-assigned-lawyers', clientId],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from('client_lawyer_assignments')
        .select(`
          id,
          lawyer_id,
          assigned_at,
          profiles:lawyer_id (
            id,
            full_name,
            profile_pic
          )
        `)
        .eq('client_id', clientId);
      
      return assignments || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12 text-gray-500">
        Client information not found
      </div>
    );
  }

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
        <div className="flex-1">
          <span className="text-sm text-gray-600">{label}: </span>
          <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
          <InfoRow icon={CreditCard} label="Aadhaar Number" value={client.aadhaar_no} />
          
          {client.status && (
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Status: </span>
                <Badge className={
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }>
                  {client.status}
                </Badge>
              </div>
            </div>
          )}
          
          {client.client_portal_enabled !== null && (
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Client Portal: </span>
                <Badge variant={client.client_portal_enabled ? 'default' : 'outline'}>
                  {client.client_portal_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Information */}
      {(client.address || client.city || client.district || client.state) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <CardTitle>Address Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={MapPin} label="Address" value={client.address} />
            <InfoRow icon={MapPin} label="City" value={client.city} />
            <InfoRow icon={MapPin} label="District" value={client.district} />
            <InfoRow icon={MapPin} label="State" value={client.state} />
          </CardContent>
        </Card>
      )}

      {/* Professional Details */}
      {(client.type || client.organization || client.designation || client.company_address || client.company_phone || client.company_email) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <CardTitle>Professional Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={UserCheck} label="Type" value={client.type} />
            <InfoRow icon={Building} label="Organization" value={client.organization} />
            <InfoRow icon={Briefcase} label="Designation" value={client.designation} />
            <InfoRow icon={MapPin} label="Company Address" value={client.company_address} />
            <InfoRow icon={Phone} label="Company Phone" value={client.company_phone} />
            <InfoRow icon={Mail} label="Company Email" value={client.company_email} />
          </CardContent>
        </Card>
      )}

      {/* Reference & Source */}
      {(client.source || client.referred_by_name || client.referred_by_phone || client.case_ref) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <CardTitle>Reference & Source</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Globe} label="Source" value={client.source} />
            <InfoRow icon={Users} label="Referred By" value={client.referred_by_name} />
            <InfoRow icon={Phone} label="Reference Phone" value={client.referred_by_phone} />
            <InfoRow icon={FileText} label="Case Reference" value={client.case_ref} />
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {client.services && client.services.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <CardTitle>Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {client.services.map((service: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Lawyers */}
      {assignedLawyers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <CardTitle>Assigned Lawyers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignedLawyers.map((assignment: any) => (
              <div key={assignment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {assignment.profiles?.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Assigned on {new Date(assignment.assigned_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Account Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <CardTitle>Account Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.appointment_date && (
            <InfoRow 
              icon={Calendar} 
              label="Appointment Date" 
              value={new Date(client.appointment_date).toLocaleDateString()}
            />
          )}
          {client.created_at && (
            <InfoRow 
              icon={Calendar} 
              label="Created Date" 
              value={new Date(client.created_at).toLocaleDateString()}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
