
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartBookingCalendar } from '@/components/appointments/SmartBookingCalendar';
import { Calendar, Clock, User, Mail, Phone, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface LawyerInfo {
  id: string;
  full_name: string;
  email: string;
}

interface BookingFormProps {
  lawyer: LawyerInfo;
  onSuccess: (details: any) => void;
}

interface FormData {
  selectedDate: Date | null;
  selectedTime: string;
  durationMinutes: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  reason: string;
  isCaseRelated: boolean;
  caseTitle: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({ lawyer, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    selectedDate: null,
    selectedTime: '',
    durationMinutes: 30,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    reason: '',
    isCaseRelated: false,
    caseTitle: '',
  });

  const handleDateTimeSelect = (date: Date, time: string, duration: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDate: date,
      selectedTime: time,
      durationMinutes: duration
    }));
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const canProceedToStep2 = formData.selectedDate && formData.selectedTime;
  const canProceedToStep3 = formData.clientName && formData.clientEmail;

  const handleSubmit = async () => {
    if (!formData.selectedDate || !formData.selectedTime) {
      alert('Please select a date and time');
      return;
    }

    setLoading(true);

    try {
      // Get lawyer's firm_id first
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', lawyer.id)
        .single();

      if (teamError || !teamMember) {
        console.error('Error finding lawyer firm:', teamError);
        alert('Failed to book appointment. Please try again.');
        return;
      }

      // Create appointment directly in main appointments table
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          lawyer_id: lawyer.id,
          appointment_date: format(formData.selectedDate, 'yyyy-MM-dd'),
          appointment_time: formData.selectedTime,
          duration_minutes: formData.durationMinutes,
          title: `Appointment with ${formData.clientName}`,
          notes: formData.reason,
          type: 'in-person',
          status: 'upcoming',
          firm_id: teamMember.firm_id,
          is_visible_to_team: true,
          created_by: lawyer.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        alert('Failed to book appointment. Please try again.');
        return;
      }

      // Send notification to the lawyer
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: lawyer.id,
          notification_type: 'appointment',
          title: 'New Appointment Scheduled',
          message: `New appointment scheduled with ${formData.clientName} on ${format(formData.selectedDate, 'yyyy-MM-dd')} at ${formData.selectedTime}`,
          reference_id: appointment.id,
          read: false
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      onSuccess({
        date: formData.selectedDate,
        time: formData.selectedTime,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
      });

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SmartBookingCalendar
          selectedLawyer={lawyer.id}
          selectedDate={formData.selectedDate || undefined}
          selectedTime={formData.selectedTime}
          hideLawyerPicker
          onTimeSlotSelect={(date, time, duration) => handleDateTimeSelect(date, time, duration)}
        />
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={() => setCurrentStep(2)}
            disabled={!canProceedToStep2}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Your Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="clientName">Full Name *</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) => handleInputChange('clientName', e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="clientEmail">Email Address *</Label>
          <Input
            id="clientEmail"
            type="email"
            value={formData.clientEmail}
            onChange={(e) => handleInputChange('clientEmail', e.target.value)}
            placeholder="Enter your email address"
          />
        </div>

        <div>
          <Label htmlFor="clientPhone">Phone Number</Label>
          <Input
            id="clientPhone"
            value={formData.clientPhone}
            onChange={(e) => handleInputChange('clientPhone', e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <Label htmlFor="reason">Reason for Appointment</Label>
          <Textarea
            id="reason"
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder="Brief description of what you'd like to discuss"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="caseRelated"
            checked={formData.isCaseRelated}
            onCheckedChange={(checked) => handleInputChange('isCaseRelated', checked)}
          />
          <Label htmlFor="caseRelated">This is related to an existing case</Label>
        </div>

        {formData.isCaseRelated && (
          <div>
            <Label htmlFor="caseTitle">Case Title</Label>
            <Input
              id="caseTitle"
              value={formData.caseTitle}
              onChange={(e) => handleInputChange('caseTitle', e.target.value)}
              placeholder="Enter case title or reference"
            />
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            Back
          </Button>
          <Button 
            onClick={() => setCurrentStep(3)}
            disabled={!canProceedToStep3}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Confirm Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Appointment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {formData.selectedDate ? format(formData.selectedDate, 'EEEE, MMMM d, yyyy') : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{formData.selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{formData.durationMinutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">With:</span>
                <span className="font-medium">{lawyer.full_name}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Your Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{formData.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{formData.clientEmail}</span>
              </div>
              {formData.clientPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{formData.clientPhone}</span>
                </div>
              )}
            </div>
          </div>

          {formData.reason && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Reason</h3>
              <p className="text-sm text-gray-600">{formData.reason}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Booking...' : 'Confirm Appointment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Date & Time</span>
          <span>Your Info</span>
          <span>Confirm</span>
        </div>
      </div>

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  );
};
