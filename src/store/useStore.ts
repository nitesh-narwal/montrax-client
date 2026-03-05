import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Subscription } from '@/types';

interface AppState {
  token: string | null;
  user: User | null;
  subscription: Subscription | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setSubscription: (sub: Subscription | null) => void;
  isPremiumFeatureAllowed: (feature: string) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      subscription: null,
      setAuth: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, subscription: null });
      },
      setSubscription: (subscription) => set({ subscription }),
      isPremiumFeatureAllowed: (feature) => {
        const sub = get().subscription;
        if (!sub) return false;
        if (feature === 'ai-basic') return sub.planType !== 'FREE';
        if (feature === 'ai-premium') return sub.planType === 'PREMIUM';
        if (feature === 'csv-import') return sub.planType !== 'FREE';
        return true;
      },
    }),
    {
      name: 'money-manager-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        subscription: state.subscription  // Now persist subscription too
      }),
    }
  )
);
