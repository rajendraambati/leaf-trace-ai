import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhoneOTPVerificationProps {
  onVerificationSuccess: (phoneNumber: string) => void;
  initialPhone?: string;
}

export function PhoneOTPVerification({ onVerificationSuccess, initialPhone = '' }: PhoneOTPVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format (Indian format)
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian phone number",
        variant: "destructive",
      });
      return;
    }

    setSendingOTP(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone_number: phoneNumber }
      });

      if (error) throw error;

      setOtpSent(true);
      startCountdown();
      
      toast({
        title: "OTP Sent",
        description: data.development_mode 
          ? `OTP: ${data.otp} (Development Mode)`
          : "OTP has been sent to your phone number",
      });

      // If in development mode, show OTP in console
      if (data.development_mode && data.otp) {
        console.log('Development OTP:', data.otp);
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setVerifyingOTP(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { 
          phone_number: phoneNumber,
          otp: otp
        }
      });

      if (error) throw error;

      if (data.verified) {
        setIsVerified(true);
        toast({
          title: "Success",
          description: "Phone number verified successfully!",
        });
        onVerificationSuccess(phoneNumber);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleResendOTP = () => {
    setOtp('');
    handleSendOTP();
  };

  if (isVerified) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Phone number {phoneNumber} has been verified successfully!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Phone Number Verification
        </CardTitle>
        <CardDescription>
          Verify your phone number to proceed with registration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <Input
              id="phone"
              type="tel"
              placeholder="+91 9876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={otpSent}
              className="flex-1"
            />
            <Button
              onClick={handleSendOTP}
              disabled={sendingOTP || (otpSent && countdown > 0)}
              type="button"
            >
              {sendingOTP ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : otpSent && countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : otpSent ? (
                'Resend OTP'
              ) : (
                'Send OTP'
              )}
            </Button>
          </div>
        </div>

        {otpSent && (
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <div className="flex gap-2">
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="flex-1"
              />
              <Button
                onClick={handleVerifyOTP}
                disabled={verifyingOTP || otp.length !== 6}
                type="button"
              >
                {verifyingOTP ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Didn't receive OTP? {countdown > 0 ? `Wait ${countdown}s` : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-primary hover:underline"
                  disabled={sendingOTP}
                >
                  Resend OTP
                </button>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
