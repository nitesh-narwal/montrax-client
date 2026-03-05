import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Auth layout with blurred background image for Login/Register pages
 * Uses a finance-themed background image with blur effect
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 scale-105"
        style={{
          backgroundImage: `url('/background-image.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(8px)',
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-background/80 via-background/70 to-primary/20" />

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl z-[1]" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-income/20 rounded-full blur-3xl z-[1]" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
}

