import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookingForm } from '@/components/booking/BookingForm';
import { LawyerProfile } from '@/components/booking/LawyerProfile';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { Loader2, AlertCircle } from 'lucide-react';

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

      // Check if lawyerId is a placeholder or not a valid UUID format
      if (lawyerId.startsWith(':') || !UUID_REGEX.test(lawyerId)) {
        setError(`Invalid lawyer ID format: "${lawyerId}". Please check the URL.`);
        console.error('Invalid lawyerId:', lawyerId);
        setLoading(false);
        return;
      }

      setLoading(true); // Ensure loading is true before fetch
      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_pic, role, specializations, location, bio')
          .eq('id', lawyerId)
          .eq('role', 'lawyer') // Ensure we are only fetching lawyers
          .single();

        if (dbError) {
          console.error('Error fetching lawyer:', dbError);
          setError('Could not find the lawyer. They may not exist or are not available for booking.');
        } else if (data) {
          setLawyer(data);
        } else {
          // This case might be redundant if .single() throws an error for no rows,
          // but good for explicit handling.
          setError('Lawyer not found.');
        }
      } catch (err) {
        console.error('Exception fetching lawyer:', err);
        setError('An unexpected error occurred while loading lawyer information.');
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Lawyer Not Found</h1>
          <p className="text-gray-600 max-w-md mx-auto">{error || 'The requested lawyer could not be found. Please ensure the link is correct or try again later.'}</p>
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
