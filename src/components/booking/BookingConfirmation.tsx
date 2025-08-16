
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, User, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface LawyerInfo {
  id: string;
  full_name: string;
  email: string;
}

interface ConfirmationDetails {
  date: Date;
  time: string;
  clientName: string;
  clientEmail: string;
}

interface BookingConfirmationProps {
  lawyer: LawyerInfo;
  confirmationDetails: ConfirmationDetails;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  lawyer,
  confirmationDetails,
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Appointment Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p>
              Your appointment has been confirmed and added to our calendar. 
              You will receive a confirmation email shortly.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">Appointment Details</h3>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">
                  {format(confirmationDetails.date, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">Date</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">{confirmationDetails.time}</p>
                <p className="text-sm text-gray-600">Time (30 minutes)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">{lawyer.full_name}</p>
                <p className="text-sm text-gray-600">Legal Consultant</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">{confirmationDetails.clientEmail}</p>
                <p className="text-sm text-gray-600">Confirmation will be sent here</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your appointment is confirmed and reserved</li>
              <li>• You'll receive a confirmation email with meeting details</li>
              <li>• Please arrive 5 minutes early for your appointment</li>
              <li>• For any changes, please contact our office directly</li>
            </ul>
          </div>

          <div className="text-center">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Book Another Appointment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
