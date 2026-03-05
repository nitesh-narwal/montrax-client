import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AuthLayout from '@/components/layouts/AuthLayout';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/forgot-password', { email: data.email });
      setSubmittedEmail(data.email);
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      // Even on error, show success message to prevent email enumeration
      setSubmittedEmail(data.email);
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/20 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground mt-1">We've sent a password reset link</p>
        </div>

        <div className="bg-card/95 backdrop-blur-md rounded-xl p-6 border border-border shadow-xl space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="w-5 h-5" />
            <span className="text-sm">{submittedEmail}</span>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            If an account with that email exists, you'll receive a password reset link shortly.
            The link will expire in 1 hour.
          </p>

          <div className="pt-4 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              Try a different email
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4 bg-card/80 backdrop-blur-sm rounded-lg py-2">
          <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4 shadow-lg">
          <IndianRupee className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">Forgot password?</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your email to reset your password</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card/95 backdrop-blur-md rounded-xl p-6 border border-border shadow-xl space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            className="bg-background/80"
          />
          {errors.email && <p className="text-xs text-expense mt-1">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4 bg-card/80 backdrop-blur-sm rounded-lg py-2">
        Remember your password?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

