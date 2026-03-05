import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AuthLayout from '@/components/layouts/AuthLayout';

const schema = z.object({
  fullname: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
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
  const [success, setSuccess] = useState(false);

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
      });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center bg-card/95 backdrop-blur-md rounded-xl p-8 border border-border shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-income/10 mb-4">
            <CheckCircle className="w-8 h-8 text-income" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Check your email!</h1>
          <p className="text-muted-foreground mb-6">We've sent an activation link to your email address. Click the link to activate your account.</p>
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
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4 bg-card/80 backdrop-blur-sm rounded-lg py-2">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
