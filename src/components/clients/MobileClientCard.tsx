import React from 'react';
import { Phone, Mail, Star, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MobileClientCardProps {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  organization?: string;
  status: 'active' | 'inactive' | 'lead' | 'new';
  active_case_count: number;
  is_vip?: boolean;
  computed_status?: 'active' | 'inactive' | 'lead';
  onClick: () => void;
}

export const MobileClientCard: React.FC<MobileClientCardProps> = ({
  full_name,
  email,
  phone,
  organization,
  status,
  active_case_count,
  is_vip,
  computed_status,
  onClick,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = () => {
    const displayStatus = computed_status || status;
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      lead: { label: 'Lead', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      new: { label: 'New', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    };
    const config = statusConfig[displayStatus] || statusConfig.lead;
    
    return (
      <Badge variant="outline" className={cn("text-xs font-medium border", config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 border border-border active:scale-[0.98] transition-transform cursor-pointer"
    >
      {/* Header with Avatar and VIP */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-12 h-12 flex-shrink-0 bg-slate-100">
          <AvatarFallback className="bg-slate-800 text-white font-semibold text-sm">
            {getInitials(full_name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base text-foreground leading-tight line-clamp-1">
              {full_name}
            </h3>
            {is_vip && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <span className="text-xs text-muted-foreground">
              {active_case_count} {active_case_count === 1 ? 'case' : 'cases'}
            </span>
          </div>
        </div>
      </div>

      {/* Organization */}
      {organization && (
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{organization}</span>
        </div>
      )}

      {/* Contact Info */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        {phone && (
          <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </a>
        )}
      </div>
    </div>
  );
};
