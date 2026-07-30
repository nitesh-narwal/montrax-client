import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function ActivatePage() {
  const { token } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token) {
      api.get(`/activate/${token}`)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {status === 'loading' && <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />}
        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-income/10 mb-4">
              <CheckCircle className="w-8 h-8 text-income" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Account Activated!</h1>
            <p className="text-muted-foreground mb-6">Your account has been successfully activated.</p>
            <Link to="/login"><Button>Go to Login</Button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-expense/10 mb-4">
              <XCircle className="w-8 h-8 text-expense" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Activation Failed</h1>
            <p className="text-muted-foreground mb-6">The activation link is invalid or expired.</p>
            <Link to="/register"><Button variant="outline">Back to Register</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}
