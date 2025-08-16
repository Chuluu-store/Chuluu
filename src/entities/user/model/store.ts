import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { User, UserPreferences } from "./types";

interface UserState {
  // Data
  user: User | null;
  preferences: UserPreferences;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  logout: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: "system",
  language: "ko",
  gridSize: "medium",
  autoUpload: false,
  showMetadata: false,
};

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        preferences: defaultPreferences,
        isAuthenticated: false,

        // Actions
        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
          }),

        updatePreferences: (newPreferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...newPreferences },
          })),

        logout: () =>
          set({
            user: null,
            isAuthenticated: false,
            preferences: defaultPreferences,
          }),
      }),
      {
        name: "user-store",
        partialize: (state) => ({
          preferences: state.preferences,
        }),
      }
    ),
    { name: "user-store" }
  )
);
