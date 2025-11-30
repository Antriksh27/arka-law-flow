import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Building, Briefcase, Users, Calendar, UserCheck, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { InlineEditCard } from './InlineEditCard';
import { z } from 'zod';
import { useIsMobile } from '@/hooks/use-mobile';
interface ClientInformationProps {
  clientId: string;
}
export const ClientInformation: React.FC<ClientInformationProps> = ({
  clientId
}) => {
  const isMobile = useIsMobile();
  const {
    data: client,
    isLoading,
    refetch
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

  // Validation schemas
  const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }).or(z.literal(''));
  const phoneSchema = z.string().trim().max(20, { message: "Phone must be less than 20 characters" }).or(z.literal(''));
  const textSchema = (max: number) => z.string().trim().max(max, { message: `Must be less than ${max} characters` }).or(z.literal(''));

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

  // Define fields for each card
  const personalFields = [
    { key: 'full_name', label: 'Full Name', icon: User, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'email', label: 'Email', icon: Mail, type: 'email' as const, maxLength: 255, validation: emailSchema },
    { key: 'phone', label: 'Phone', icon: Phone, type: 'tel' as const, maxLength: 20, validation: phoneSchema },
    { key: 'type', label: 'Client Type', icon: UserCheck, type: 'text' as const, maxLength: 50, validation: textSchema(50) },
  ];

  const addressFields = [
    { key: 'address', label: 'Address', icon: MapPin, type: 'text' as const, maxLength: 255, validation: textSchema(255) },
    { key: 'district', label: 'District', icon: MapPin, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'state', label: 'State', icon: MapPin, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'pin_code', label: 'PIN Code', icon: MapPin, type: 'text' as const, maxLength: 10, validation: textSchema(10) },
  ];

  const professionalFields = [
    { key: 'organization', label: 'Organization', icon: Building, type: 'text' as const, maxLength: 200, validation: textSchema(200) },
    { key: 'designation', label: 'Designation', icon: Briefcase, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'company_address', label: 'Company Address', icon: MapPin, type: 'text' as const, maxLength: 255, validation: textSchema(255) },
    { key: 'company_phone', label: 'Company Phone', icon: Phone, type: 'tel' as const, maxLength: 20, validation: phoneSchema },
    { key: 'company_email', label: 'Company Email', icon: Mail, type: 'email' as const, maxLength: 255, validation: emailSchema },
  ];

  const referenceFields = [
    { key: 'referred_by_name', label: 'Referred By', icon: Users, type: 'text' as const, maxLength: 100, validation: textSchema(100) },
    { key: 'referred_by_phone', label: 'Reference Phone', icon: Phone, type: 'tel' as const, maxLength: 20, validation: phoneSchema },
  ];

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

  return <div className={isMobile ? "space-y-4 pb-4" : "space-y-6"}>
      {/* Personal Details */}
      <InlineEditCard
        title="Personal Details"
        icon={User}
        fields={personalFields}
        clientId={clientId}
        clientData={client}
        onUpdate={refetch}
      />

      {/* Address Information */}
      <InlineEditCard
        title="Address Information"
        icon={MapPin}
        fields={addressFields}
        clientId={clientId}
        clientData={client}
        onUpdate={refetch}
      />

      {/* Professional Details */}
      <InlineEditCard
        title="Professional Details"
        icon={Building}
        fields={professionalFields}
        clientId={clientId}
        clientData={client}
        onUpdate={refetch}
      />

      {/* Reference Information */}
      <InlineEditCard
        title="Reference Information"
        icon={Users}
        fields={referenceFields}
        clientId={clientId}
        clientData={client}
        onUpdate={refetch}
      />

      {/* Account Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className={isMobile ? "w-4 h-4 text-blue-600" : "w-5 h-5 text-blue-600"} />
            <CardTitle className={isMobile ? "text-base" : ""}>Account Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? "space-y-3 px-3 pb-3" : "space-y-4"}>
          <InfoRow icon={Calendar} label="Created Date" value={TimeUtils.formatDate(client.created_at)} />
          <InfoRow icon={Calendar} label="Last Edited Date" value={TimeUtils.formatDate(client.updated_at)} />
        </CardContent>
      </Card>
    </div>;
};