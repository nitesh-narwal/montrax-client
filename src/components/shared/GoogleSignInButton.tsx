import { Button } from '@/components/ui/button';

interface GoogleSignInButtonProps {
  apiBaseUrl: string;
}

/**
 * Google OAuth2 is a browser redirect flow, not a JSON API call — this navigates
 * the whole page to the backend, which bounces to Google and back to /oauth2/redirect.
 */
export function GoogleSignInButton({ apiBaseUrl }: GoogleSignInButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 bg-background/80"
      onClick={() => {
        window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
      }}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12C3.24 21.3 7.28 24 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.61H1.26a12 12 0 0 0 0 10.78l4.01-3.12z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.61l4.01 3.12C6.22 6.88 8.87 4.77 12 4.77z" />
      </svg>
      Sign in with Google
    </Button>
  );
}
