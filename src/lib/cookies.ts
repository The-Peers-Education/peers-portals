import type { Role } from "@/types";

export const AUTH_COOKIE = "peers_auth";
export const ROLE_COOKIE = "peers_role";

export function setAuthCookie(role?: Role | null) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  if (role) {
    document.cookie = `${ROLE_COOKIE}=${role}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
