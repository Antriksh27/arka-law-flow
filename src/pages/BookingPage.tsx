import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookingForm } from '@/components/booking/BookingForm';
import { LawyerProfile } from '@/components/booking/LawyerProfile';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { Loader2, AlertCircle } from 'lucide-react';
import { clientRateLimiter, sanitizeInput } from '@/lib/securityHeaders';

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

// Roles that are allowed to have a public booking page
const ALLOWED_BOOKING_ROLES = ['lawyer', 'admin', 'partner', 'associate', 'paralegal'];

export const BookingPage: React.FC = () => {
  const { lawyerId } = useParams<{ lawyerId: string }>();
  const [lawyer, setLawyer] = useState<LawyerInfo | null>(null);
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

      // Enhanced security validation
      const sanitizedLawyerId = sanitizeInput(lawyerId);
      if (lawyerId.startsWith(':') || !UUID_REGEX.test(sanitizedLawyerId)) {
        setError(`Invalid lawyer ID format. Please check the URL.`);
        console.error('Invalid lawyerId:', sanitizedLawyerId);
        setLoading(false);
        return;
      }

      // Rate limiting for public endpoint
      const clientIp = 'anonymous_' + Date.now(); // Simple client identification
      if (!clientRateLimiter.isAllowed(clientIp, 10, 60000)) {
        setError('Too many requests. Please wait a moment before trying again.');
        setLoading(false);
        return;
      }

      setLoading(true); 
      try {
        const { data, error: rpcError } = await supabase
          .rpc('get_profile_by_id', { user_id: sanitizedLawyerId });

        if (rpcError) {
          console.error('Error fetching profile for booking (RPC):', rpcError);
          setError('Could not find the professional. They may not exist or are not available for booking.');
        } else if (Array.isArray(data) && data.length > 0) {
          const row = data[0] as { id: string; full_name: string; role: string };
          // Ensure only allowed roles can be booked
          if (!ALLOWED_BOOKING_ROLES.includes(row.role)) {
            setError('Professional not found or not eligible for booking.');
          } else {
            // Map minimal RPC result to LawyerInfo; optional fields left null
            setLawyer({
              id: row.id,
              full_name: row.full_name,
              email: '',
              profile_pic: null,
              role: row.role,
              specializations: null,
              location: null,
              bio: null,
            });
          }
        } else {
          setError('Professional not found or not eligible for booking.');
        }
      } catch (err) {
        console.error('Exception fetching professional for booking:', err);
        setError('An unexpected error occurred while loading professional information.');
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

  if (error || !lawyer) {
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
