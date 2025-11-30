import React, { useState } from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Phone, Shield } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const ClientAuth: React.FC = () => {
  const { user, loading, sendOtp, verifyOtp } = useClientAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!loading && user) {
    return <Navigate to="/client/cases" replace />;
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    setIsLoading(true);
    const formattedPhone = `+91${phone}`;
    
    const result = await sendOtp(formattedPhone);
    
    if (result.success) {
      toast.success('OTP sent successfully to your mobile number');
      setStep('otp');
    } else {
      toast.error(result.error || 'Failed to send OTP');
    }
    
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    const formattedPhone = `+91${phone}`;
    
    const result = await verifyOtp(formattedPhone, otp);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate('/client/cases');
    } else {
      toast.error(result.error || 'Invalid OTP');
      setOtp('');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">Client Portal</CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Enter your registered mobile number to receive OTP'
              : 'Enter the 6-digit OTP sent to your mobile'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3 py-2 border border-input rounded-md bg-muted text-sm font-medium">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    required
                    className="flex-1"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || phone.length !== 10}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-center block">
                  Enter OTP sent to +91{phone}
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                  }}
                  disabled={isLoading}
                >
                  Change Mobile Number
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAuth;