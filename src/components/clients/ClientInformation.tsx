import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar,
  UserCheck,
  FileText,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClientInformationProps {
  clientId: string;
}

export const ClientInformation: React.FC<ClientInformationProps> = ({
  clientId
}) => {
  const { data: client, isLoading } = useQuery({
    queryKey: ['client-information', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          profiles:assigned_lawyer_id(full_name, email)
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
    </div>;
  }

  if (!client) {
    return <div className="text-center py-8 text-gray-500">
      Client information not found
    </div>;
  }

  const personalInfo = [
    { label: 'Full Name', value: client.full_name, icon: User },
    { label: 'Email', value: client.email, icon: Mail },
    { label: 'Phone', value: client.phone, icon: Phone },
    { label: 'Aadhaar Number', value: client.aadhaar_no, icon: FileText }
  ];

  const addressInfo = [
    { label: 'Address', value: client.address },
    { label: 'City', value: client.city }
  ];

  const companyInfo = [
    { label: 'Organization', value: client.organization, icon: Building2 }
  ];

  const professionalInfo = [
    { label: 'Status', value: client.status },
    { label: 'Assigned Lawyer', value: client.profiles?.full_name },
    { label: 'Case Reference', value: client.case_ref },
    { label: 'Appointment Date', value: client.appointment_date ? new Date(client.appointment_date).toLocaleDateString() : null }
  ];

  const InfoSection = ({ title, items, icon: SectionIcon }: any) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {SectionIcon && <SectionIcon className="w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item: any, index: number) => {
          const IconComponent = item.icon;
          return item.value ? (
            <div key={index} className="flex items-center gap-3">
              {IconComponent && <IconComponent className="w-4 h-4 text-gray-500 flex-shrink-0" />}
              <div className="flex-1">
                <span className="text-sm text-gray-600">{item.label}:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            </div>
          ) : null;
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
        <div className="flex items-center gap-2">
          <Badge 
            variant={client.status === 'active' ? 'default' : 'outline'}
            className="capitalize"
          >
            {client.status}
          </Badge>
          {client.client_portal_enabled && (
            <Badge variant="success" className="capitalize">
              Portal Enabled
            </Badge>
          )}
        </div>
      </div>

      {/* Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <InfoSection 
          title="Personal Information" 
          items={personalInfo}
          icon={User}
        />

        {/* Company Information */}
        {client.organization && (
          <InfoSection 
            title="Company Information" 
            items={companyInfo}
            icon={Building2}
          />
        )}

        {/* Address Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addressInfo.map((item, index) => 
                item.value ? (
                  <div key={index}>
                    <span className="text-sm text-gray-600">{item.label}:</span>
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionalInfo.map((item, index) => 
                item.value ? (
                  <div key={index}>
                    <span className="text-sm text-gray-600">{item.label}:</span>
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Notes */}
      {client.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};