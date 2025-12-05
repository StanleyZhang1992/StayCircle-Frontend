"use client";

import { useEffect, useState } from "react";
import { listMyBookings, cancelBooking, type Booking } from "../../lib/api";
import { getAuth } from "../../lib/auth";

export default function MyBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean>(false);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listMyBookings({ limit: 50, offset: 0 });
      setItems(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load bookings";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setAuthed(!!getAuth());
    refresh();
  }, []);

  async function onCancel(id: number) {
    try {
      const updated = await cancelBooking(id);
      setItems((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to cancel booking";
      alert(message);
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-3xl p-4 md:p-6">
        <h1 className="mb-4 text-2xl font-semibold">My bookings</h1>
        <p className="text-sm text-gray-600">Please sign in to view your bookings.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My bookings</h1>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-600">No bookings found.</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((b) => (
            <li key={b.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div>
                    Property ID: <span className="font-medium">{b.property_id}</span>
                  </div>
                  <div className="text-gray-700">
                    {b.start_date} → {b.end_date}
                  </div>
                  <div className="text-xs text-gray-500">Booking ID: {b.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      b.status === "reserved"
                        ? "rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                        : "rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
                    }
                  >
                    {b.status}
                  </span>
                  {b.status === "reserved" && (
                    <button
                      type="button"
                      onClick={() => onCancel(b.id)}
                      className="rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
