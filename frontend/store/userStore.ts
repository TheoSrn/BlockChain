/**
 * User Store - État utilisateur global
 * Préférences, settings, etc.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark';
  currency: 'USD' | 'EUR' | 'GBP';
  slippageTolerance: number;
  notifications: boolean;
}

interface UserState {
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  setSlippageTolerance: (value: number) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  currency: 'USD',
  slippageTolerance: 0.5, // 0.5%
  notifications: true,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,

      setPreference: (key, value) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        })),

      setSlippageTolerance: (value) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            slippageTolerance: value,
          },
        })),

      resetPreferences: () =>
        set({
          preferences: defaultPreferences,
        }),
    }),
    {
      name: 'user-preferences',
    }
  )
);
