import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import api, { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import AuthLayout from '@/components/layouts/AuthLayout';
import { getErrorMessage } from '@/lib/utils';
import { GoogleSignInButton } from '@/components/shared/GoogleSignInButton';

const schema = z.object({
  fullname: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Use international format, e.g. +919876543210'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/register', {
        fullname: data.fullname,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
      });
      toast.success('Account created! Verify your phone to continue.');
      navigate('/verify-otp', { state: { phoneNumber: data.phoneNumber } });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4 shadow-lg">
          <IndianRupee className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground mt-1">Start managing your finances today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card/95 backdrop-blur-md rounded-xl p-6 border border-border shadow-xl space-y-4">
        <div>
          <Label htmlFor="fullname">Full Name</Label>
          <Input id="fullname" placeholder="John Doe" {...register('fullname')} className="bg-background/80" />
          {errors.fullname && <p className="text-xs text-expense mt-1">{errors.fullname.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} className="bg-background/80" />
          {errors.email && <p className="text-xs text-expense mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+919876543210"
              {...register('phoneNumber')}
              className="bg-background/80 pl-9"
            />
          </div>
          {errors.phoneNumber ? (
            <p className="text-xs text-expense mt-1">{errors.phoneNumber.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">We'll text you a 6-digit code to verify it.</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
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
          {errors.password && <p className="text-xs text-expense mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            className="bg-background/80"
          />
          {errors.confirmPassword && <p className="text-xs text-expense mt-1">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Create Account
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <GoogleSignInButton apiBaseUrl={API_BASE_URL} />
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4 bg-card/80 backdrop-blur-sm rounded-lg py-2">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
