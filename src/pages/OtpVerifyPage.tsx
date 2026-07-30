import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { IndianRupee, Loader2, Mail, PhoneCall, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AuthLayout from '@/components/layouts/AuthLayout';
import { getErrorMessage } from '@/lib/utils';

const RESEND_COOLDOWN_SECONDS = 60;

export default function OtpVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPhone = (location.state as { phoneNumber?: string } | null)?.phoneNumber || '';

  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!phoneNumber || cooldown > 0) return;
    setSending(true);
    try {
      await api.post('/api/otp/resend', { phoneNumber });
      toast.success('OTP sent! Check your phone.');
      startCooldown();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!phoneNumber || code.length !== 6) {
      toast.error('Enter your phone number and the 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/api/otp/verify', { phoneNumber, code });
      setVerified(true);
      toast.success('Phone verified!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid or expired code'));
    } finally {
      setVerifying(false);
    }
  };

  if (verified) {
    return (
      <AuthLayout>
        <div className="text-center bg-card/95 backdrop-blur-md rounded-xl p-8 border border-border shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-income/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-income" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Phone verified!</h1>
          <p className="text-muted-foreground mb-6">
            You can now sign in. If you also received an activation email, click that link first.
          </p>
          <Link to="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4 shadow-lg">
          <IndianRupee className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">Verify your phone</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter the 6-digit code we texted you</p>
      </div>

      <div className="bg-card/95 backdrop-blur-md rounded-xl p-6 border border-border shadow-xl space-y-5">
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <div className="relative">
            <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+919876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-background/80 pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Label>Verification Code</Label>
          <InputOTP maxLength={6} value={code} onChange={setCode}>
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

        <Button onClick={handleVerify} className="w-full" disabled={verifying}>
          {verifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Verify Phone
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={handleResend}
          disabled={sending || cooldown > 0 || !phoneNumber}
        >
          {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          Didn't get a text? We'll email the code to your signup address instead.
        </p>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4 bg-card/80 backdrop-blur-sm rounded-lg py-2">
        <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
      </p>
    </AuthLayout>
  );
}
