import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

/**
 * Landing spot for the Google OAuth2 redirect flow. The backend sends the browser
 * here with either ?code=<one-time exchange code> (success) or ?error=<message>
 * (failure) after the user approves/denies on Google's consent screen. The code
 * is single-use and expires in 60s - it's immediately swapped for the real JWT
 * via a POST body so the token itself never appears in a URL, browser history,
 * or access logs.
 */
export default function OAuth2RedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error(error || 'Google sign-in failed');
      navigate('/login', { replace: true });
      return;
    }

    if (!code) {
      toast.error('No code received from Google sign-in');
      navigate('/login', { replace: true });
      return;
    }

    api.post('/oauth2/exchange', { code })
      .then((res) => {
        const token = res.data.token;
        localStorage.setItem('token', token);
        return api.get('/profile').then((profileRes) => {
          setAuth(token, profileRes.data);
          toast.success('Signed in with Google!');
          navigate('/dashboard', { replace: true });
        });
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, 'Failed to complete Google sign-in'));
        navigate('/login', { replace: true });
      });
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  );
}
