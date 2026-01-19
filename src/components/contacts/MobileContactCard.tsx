import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Building2, ChevronRight } from 'lucide-react';

interface MobileContactCardProps {
  contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
    contact_type?: string;
  };
  onClick: () => void;
}

const getInitials = (name: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getContactTypeBadge = (type: string | undefined) => {
  const typeStyles: Record<string, { bg: string; text: string }> = {
    advocate: { bg: 'bg-blue-50', text: 'text-blue-700' },
    client_referral: { bg: 'bg-green-50', text: 'text-green-700' },
    court_official: { bg: 'bg-purple-50', text: 'text-purple-700' },
    expert_witness: { bg: 'bg-amber-50', text: 'text-amber-700' },
    vendor: { bg: 'bg-gray-50', text: 'text-gray-700' },
    other: { bg: 'bg-gray-50', text: 'text-gray-700' },
  };
  
  const styles = typeStyles[type || 'other'] || typeStyles.other;
  const label = type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Other';
  
  return (
    <Badge className={`${styles.bg} ${styles.text} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
      {label}
    </Badge>
  );
};

export const MobileContactCard: React.FC<MobileContactCardProps> = ({ contact, onClick }) => {
  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contact.phone) {
      window.open(`tel:${contact.phone}`, '_self');
    }
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contact.email) {
      window.open(`mailto:${contact.email}`, '_self');
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl border border-border p-4 active:scale-[0.98] transition-all duration-200 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate text-base">
                {contact.name}
              </p>
              {contact.organization && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.organization}
                  </p>
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
          
          {/* Type badge */}
          <div className="mt-2">
            {getContactTypeBadge(contact.contact_type)}
          </div>
        </div>
      </div>
      
      {/* Quick actions */}
      {(contact.phone || contact.email) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {contact.phone && (
            <button
              onClick={handlePhoneClick}
              className="flex items-center gap-2 flex-1 py-2.5 px-3 rounded-xl bg-green-50 text-green-700 active:scale-95 transition-transform min-h-[44px]"
            >
              <Phone className="h-4 w-4" />
              <span className="text-sm font-medium truncate">{contact.phone}</span>
            </button>
          )}
          {contact.email && (
            <button
              onClick={handleEmailClick}
              className="flex items-center gap-2 flex-1 py-2.5 px-3 rounded-xl bg-blue-50 text-blue-700 active:scale-95 transition-transform min-h-[44px]"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium truncate">Email</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};