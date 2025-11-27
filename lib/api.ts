import { getToken, saveAuth } from "./auth";
import type { User, Role } from "./auth";
export interface Property {
  id: number;
  title: string;
  price_cents: number;
}

export interface PropertyCreate {
  title: string;
  price_cents: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function listProperties(): Promise<Property[]> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/properties`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Failed to list properties: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function createProperty(data: PropertyCreate): Promise<Property> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create property: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export interface SignupPayload {
  email: string;
  password: string;
  role?: Role; // "landlord" | "tenant" (defaults to "tenant" if omitted)
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function signup(payload: SignupPayload): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to signup: ${res.status} ${res.statusText} ${text}`);
  }
  const data: TokenResponse = await res.json();
  saveAuth({ token: data.access_token, user: data.user });
  return data;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to login: ${res.status} ${res.statusText} ${text}`);
  }
  const data: TokenResponse = await res.json();
  saveAuth({ token: data.access_token, user: data.user });
  return data;
}
