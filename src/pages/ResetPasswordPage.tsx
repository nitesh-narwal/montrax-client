import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, Eye, EyeOff, Loader2, CheckCircle, XCircle, ArrowLeft, KeyRound } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AuthLayout from '@/components/layouts/AuthLayout';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidatingToken(false);
        setTokenValid(false);
        return;
      }

      try {
        const res = await api.get(`/validate-reset-token?token=${token}`);
        setTokenValid(res.data.valid);
      } catch (err) {
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/reset-password', {
        token,
        newPassword: data.newPassword
      });
      setResetSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <AuthLayout>
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-muted-foreground mt-4">Validating your reset link...</p>
        </div>
      </AuthLayout>
    );
  }

  if (!token || !tokenValid) {
    return (
      <AuthLayout>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/20 mb-4">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Invalid or expired link</h1>
          <p className="text-sm text-muted-foreground mt-1">This password reset link is no longer valid</p>
        </div>

        <div className="bg-card/95 backdrop-blur-md rounded-xl p-6 border border-border shadow-xl space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            The reset link may have expired or already been used.
            Please request a new password reset link.
          </p>

          <div className="pt-2 space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate('/forgot-password')}
            >
              Request new reset link
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Back to login
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (resetSuccess) {
    return (
      <AuthLayout>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/20 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Password reset!</h1>
          <p className="text-sm text-muted-foreground mt-1">Your password has been updated successfully</p>
        </div>

        <div className="bg-card/95 backdrop-blur-md rounded-xl p-6 border border-border shadow-xl space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            You can now sign in with your new password.
          </p>

          <Button
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
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
        <h1 className="text-2xl font-display font-bold text-foreground">Reset your password</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card/95 backdrop-blur-md rounded-xl p-6 border border-border shadow-xl space-y-4">
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('newPassword')}
              className="bg-background/80"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="text-xs text-expense mt-1">{errors.newPassword.message}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword')}
              className="bg-background/80"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-expense mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
          Reset password
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4 bg-card/80 backdrop-blur-sm rounded-lg py-2">
        <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

