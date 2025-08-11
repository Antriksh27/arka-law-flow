import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookingForm } from '@/components/booking/BookingForm';
import { LawyerProfile } from '@/components/booking/LawyerProfile';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { Loader2, AlertCircle } from 'lucide-react';

import { ALLOWED_BOOKING_ROLES } from '@/lib/bookingConfig';

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

// Basic UUID regex (simplified)
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;


export const BookingPage: React.FC = () => {
  const { lawyerId } = useParams<{ lawyerId: string }>();
  const [lawyer, setLawyer] = useState<LawyerInfo | null>(() => {
    const id = lawyerId?.trim();
    return id
      ? {
          id,
          full_name: 'Legal Professional',
          email: '',
          profile_pic: null,
          role: 'lawyer',
          specializations: null,
          location: null,
          bio: null,
        }
      : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState<any>(null);

  useEffect(() => {
    const fetchLawyer = async () => {
      if (!lawyerId) {
        setError('No lawyer ID provided in the URL.');
        setLoading(false);
        return;
      }

      const sanitizedLawyerId = lawyerId.trim();

      // Rate limiting removed for public booking endpoint

      setLoading(true); 
      try {
        // 1) Try RPC for minimal profile
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_profile_by_id', { user_id: sanitizedLawyerId });

        let base: { id: string; full_name: string; role: string } | null = null;
        if (!rpcError && rpcData) {
          if (Array.isArray(rpcData) && rpcData.length > 0) {
            base = rpcData[0] as { id: string; full_name: string; role: string };
          } else if (!Array.isArray(rpcData) && (rpcData as any).id) {
            base = rpcData as { id: string; full_name: string; role: string };
          }
        }

        // 2) Try to enrich from profiles (may be blocked by RLS for public users)
        let enrich: Partial<LawyerInfo> = {};
        try {
          const { data: p, error: selectError } = await supabase
            .from('profiles')
            .select('email, profile_pic, specializations, location, bio, role, full_name')
            .eq('id', sanitizedLawyerId)
            .maybeSingle();

          if (p && !selectError) {
            enrich = {
              email: p.email ?? '',
              profile_pic: p.profile_pic ?? null,
              role: p.role ?? base?.role ?? 'lawyer',
              specializations: p.specializations ?? null,
              location: p.location ?? null,
              bio: p.bio ?? null,
              full_name: p.full_name ?? base?.full_name ?? 'Legal Professional',
            } as Partial<LawyerInfo>;
          }
        } catch (enrichErr) {
          console.warn('Profiles enrichment skipped (likely RLS on public):', enrichErr);
        }

        const resolved: LawyerInfo = {
          id: sanitizedLawyerId,
          full_name: (base?.full_name || (enrich.full_name as string) || 'Legal Professional'),
          email: (enrich.email as string) || '',
          profile_pic: (enrich.profile_pic as string | null) ?? null,
          role: (base?.role || (enrich.role as string) || 'lawyer'),
          specializations: (enrich.specializations as string | null) ?? null,
          location: (enrich.location as string | null) ?? null,
          bio: (enrich.bio as string | null) ?? null,
        };

        setLawyer(resolved);
      } catch (err) {
        console.error('Exception fetching professional for booking, using fallback profile:', err);
        setLawyer({
          id: sanitizedLawyerId,
          full_name: 'Legal Professional',
          email: '',
          profile_pic: null,
          role: 'lawyer',
          specializations: null,
          location: null,
          bio: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLawyer();
  }, [lawyerId]);

  const handleBookingSuccess = (details: any) => {
    setConfirmationDetails(details);
    setBookingComplete(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!lawyer && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white shadow-lg rounded-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Professional Not Found</h1>
          <p className="text-gray-600 max-w-md mx-auto">{error || 'The requested professional could not be found or is not eligible for booking. Please ensure the link is correct or try again later.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
          <p className="text-gray-600">Schedule a consultation with our legal expert</p>
        </div>

        {bookingComplete ? (
          <BookingConfirmation 
            lawyer={lawyer}
            confirmationDetails={confirmationDetails}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <LawyerProfile lawyer={lawyer} />
            </div>
            <div className="lg:col-span-2">
              <BookingForm 
                lawyer={lawyer}
                onSuccess={handleBookingSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
