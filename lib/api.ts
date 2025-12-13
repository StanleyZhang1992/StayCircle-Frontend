import { getToken, saveAuth } from "./auth";
import type { User, Role } from "./auth";
export interface Property {
  id: number;
  title: string;
  price_cents: number;
  requires_approval?: boolean;
}

export interface PropertyCreate {
  title: string;
  price_cents: number;
  requires_approval?: boolean;
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

/* =========================
   Bookings API (Sprint 7)
   ========================= */

export interface Booking {
  id: number;
  property_id: number;
  guest_id: number;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
  status: "requested" | "pending_payment" | "confirmed" | "cancelled" | "cancelled_expired" | "declined";
  total_cents: number;
  currency: string; // e.g. "USD"
  expires_at?: string | null; // RFC3339
  cancel_reason?: string | null;
}

export interface BookingCreate {
  property_id: number;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
}

export type NextAction =
  | { type: "await_approval" }
  | { type: "pay"; expires_at: string; client_secret: string };

export interface BookingCreateResponse {
  booking: Booking;
  next_action: NextAction;
}

/* =========================
   Payments (Sprint 8)
   ========================= */

export interface PaymentInfoResponse {
  booking_id: number;
  client_secret: string;
  expires_at: string; // RFC3339
}

export async function getPaymentInfo(bookingId: number): Promise<PaymentInfoResponse> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/payment_info`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    cache: "no-store"
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to get payment info: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export async function createBooking(data: BookingCreate): Promise<BookingCreateResponse> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create booking: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export async function listMyBookings(params?: { limit?: number; offset?: number }): Promise<Booking[]> {
  const token = getToken();
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const res = await fetch(`${API_BASE}/api/v1/bookings/me${qs.toString() ? `?${qs.toString()}` : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    cache: "no-store"
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to list bookings: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export async function cancelBooking(bookingId: number): Promise<Booking> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to cancel booking: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export async function approveBooking(bookingId: number): Promise<Booking> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to approve booking: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export async function declineBooking(bookingId: number): Promise<Booking> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/decline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to decline booking: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export async function finalizePayment(bookingId: number): Promise<Booking | { status: string }> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/finalize_payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to finalize payment: ${res.status} ${res.statusText} ${text}`);
  }
  // Server may return the updated booking or a status object.
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) {
    return res.json();
  }
  return { status: "ok" };
}
