import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { clearAuthCookie, setAuthCookie } from "@/lib/cookies";

interface AuthState {
  token: string | null;
  user: User | null;
  activeBranchId: string | null;
  hasHydrated: boolean;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setActiveBranchId: (branchId: string | null) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      activeBranchId: null,
      hasHydrated: false,
      setSession: (token, user) => {
        const previousBranch = get().activeBranchId;
        set({
          token,
          user,
          activeBranchId:
            user.role === "SUPER_ADMIN" ? previousBranch : user.branchId,
        });
        setAuthCookie(user.role);
      },
      setUser: (user) => {
        const previousBranch = get().activeBranchId;
        set({
          user,
          activeBranchId:
            user.role === "SUPER_ADMIN" ? previousBranch : user.branchId,
        });
        setAuthCookie(user.role);
      },
      setActiveBranchId: (branchId) => set({ activeBranchId: branchId }),
      clearAuth: () => {
        set({ token: null, user: null, activeBranchId: null });
        clearAuthCookie();
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "peers-auth",
      skipHydration: true,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        activeBranchId: state.activeBranchId,
      }),
      onRehydrateStorage: () => (state, error) => {
        const next = error ? useAuthStore.getState() : state;
        next?.setHasHydrated(true);
        if (next?.token) {
          setAuthCookie(next.user?.role);
        } else {
          clearAuthCookie();
        }
      },
    },
  ),
);

export function selectEffectiveBranchId() {
  const { activeBranchId, user } = useAuthStore.getState();
  return activeBranchId ?? user?.branchId ?? null;
}
