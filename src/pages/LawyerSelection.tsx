import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mail, Calendar } from 'lucide-react';

interface Lawyer {
  id: string;
  full_name: string;
  email: string;
  profile_pic?: string;
  specializations?: string;
  location?: string;
  bio?: string;
}

export const LawyerSelection: React.FC = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_pic, specializations, location, bio')
          .eq('role', 'lawyer')
          .limit(10);

        if (error) throw error;
        setLawyers(data || []);
      } catch (error) {
        console.error('Error fetching lawyers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  const handleBookLawyer = (lawyerId: string) => {
    navigate(`/book/${lawyerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading lawyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Consultation</h1>
          <p className="text-gray-600">Choose a lawyer to schedule your appointment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lawyers.map((lawyer) => (
            <Card key={lawyer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={lawyer.profile_pic} alt={lawyer.full_name} />
                  <AvatarFallback className="text-lg">
                    {lawyer.full_name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{lawyer.full_name}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {lawyer.email}
                </div>
                
                {lawyer.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {lawyer.location}
                  </div>
                )}

                {lawyer.specializations && (
                  <div className="flex flex-wrap gap-2">
                    {lawyer.specializations.split(',').slice(0, 2).map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                {lawyer.bio && (
                  <p className="text-sm text-gray-600 line-clamp-3">{lawyer.bio}</p>
                )}

                <Button 
                  onClick={() => handleBookLawyer(lawyer.id)} 
                  className="w-full"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {lawyers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No lawyers available for booking at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};