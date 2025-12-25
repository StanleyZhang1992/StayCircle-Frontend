export type Role = "landlord" | "tenant";

export type User = {
  id: number;
  email: string;
  role: Role;
};

export type AuthState = {
  token: string;
  user: User;
};

const STORAGE_KEY = "sc_auth";
export const AUTH_EVENT = "sc-auth-change";

export function saveAuth(state: AuthState): void {
  if (typeof window === "undefined") return;  // prevents error due to SSRs
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  try {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { state } }));
  } catch {
    // ignore if CustomEvent not available
  }
}

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  try {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { state: null } }));
  } catch {
    // ignore if CustomEvent not available
  }
}

export function getToken(): string | null {
  const a = getAuth();
  return a?.token ?? null;
}

export function isLandlord(): boolean {
  const a = getAuth();
  return a?.user?.role === "landlord";
}
