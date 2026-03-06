import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Subscription } from '@/types';

interface AppState {
  token: string | null;
  user: User | null;
  subscription: Subscription | null;
  subscriptionLoaded: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  setSubscription: (sub: Subscription | null) => void;
  setSubscriptionLoaded: (loaded: boolean) => void;
  isPremiumFeatureAllowed: (feature: string) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      subscription: null,
      subscriptionLoaded: false,
      setAuth: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user });
      },
      updateUser: (user) => {
        set({ user });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, subscription: null, subscriptionLoaded: false });
      },
      setSubscription: (subscription) => set({ subscription, subscriptionLoaded: true }),
      setSubscriptionLoaded: (loaded) => set({ subscriptionLoaded: loaded }),
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
        // Don't persist subscription - always fetch fresh data
      }),
    }
  )
);
