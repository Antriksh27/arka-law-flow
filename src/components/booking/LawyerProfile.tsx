
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, User } from 'lucide-react';

interface LawyerInfo {
  id: string;
  full_name: string;
  email: string;
  profile_pic: string | null;
  role: string;
  specializations: string | null;
  location: string | null;
  bio: string | null;
}

interface LawyerProfileProps {
  lawyer: LawyerInfo;
}

export const LawyerProfile: React.FC<LawyerProfileProps> = ({ lawyer }) => {
  const getSpecializations = () => {
    if (!lawyer.specializations) return [];
    return lawyer.specializations.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'lawyer':
      case 'junior':
        return 'Advocate';
      case 'partner':
        return 'Partner';
      case 'associate':
        return 'Associate';
      default:
        return 'Legal Professional';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
      <div className="text-center mb-6">
        <Avatar className="h-24 w-24 mx-auto mb-4">
          <AvatarImage src={lawyer.profile_pic || ''} alt={lawyer.full_name} />
          <AvatarFallback className="text-xl">
            {lawyer.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {lawyer.full_name}
        </h2>
        
        <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
          <User className="h-4 w-4" />
          <span>{getRoleTitle(lawyer.role)}</span>
        </div>

        {lawyer.location && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{lawyer.location}</span>
          </div>
        )}
      </div>

      {lawyer.bio && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{lawyer.bio}</p>
        </div>
      )}

      {getSpecializations().length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {getSpecializations().map((spec, index) => (
              <Badge key={index} variant="default" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
