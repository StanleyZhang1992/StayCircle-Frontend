"use client";

import { useEffect, useState } from "react";
import type { Property, PropertyCreate } from "../lib/api";
import { listProperties, createProperty } from "../lib/api";
import { isLandlord } from "../lib/auth";

/**
 * HomePage
 * - Tailwind-only refactor (no new data libs).
 * - Orchestrates loading + refresh and composes smaller components.
 */
export default function HomePage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listProperties();
      setItems(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load properties";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load
    refresh();
  }, []);

  function handleCreated(p: Property) {
    // Optimistically prepend new item
    setItems((prev) => [p, ...prev]);
  }

  useEffect(() => {
    setCanCreate(isLandlord());
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-semibold">StayCircle — Properties</h1>

      {canCreate && (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <h2 className="mb-4 text-lg font-medium">Create a Property</h2>
          <CreatePropertyForm onCreated={handleCreated} />
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Properties</h2>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-600">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">{canCreate ? "No properties yet. Create one above." : "No properties yet."}</p>
        ) : (
          <PropertiesList items={items} />
        )}
      </section>
    </main>
  );
}

/**
 * CreatePropertyForm
 * - Local state only; minimal validation.
 * - Uses Tailwind for styling.
 */
function CreatePropertyForm({ onCreated }: { onCreated: (p: Property) => void }) {
  const [title, setTitle] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const titleTrimmed = title.trim();
    if (!titleTrimmed) {
      setErr("Title is required");
      return;
    }

    const priceNumber = Number(priceUsd);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setErr("Price must be a non-negative number");
      return;
    }

    const payload: PropertyCreate = {
      title: titleTrimmed,
      price_cents: Math.round(priceNumber * 100),
    };

    setSubmitting(true);
    try {
      const created = await createProperty(payload);
      onCreated(created);
      setTitle("");
      setPriceUsd("");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create property";
      setErr(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label htmlFor="title" className="grid gap-1.5">
        <span className="text-sm text-gray-700">Title</span>
        <input
          id="title"
          type="text"
          placeholder="Cozy studio in SF"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </label>

      <label htmlFor="priceUsd" className="grid gap-1.5">
        <span className="text-sm text-gray-700">Price (USD)</span>
        <input
          id="priceUsd"
          type="number"
          min="0"
          step="0.01"
          placeholder="99.00"
          value={priceUsd}
          onChange={(e) => setPriceUsd(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}

/**
 * PropertiesList
 * - Presentation-only list.
 */
function PropertiesList({ items }: { items: Property[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((p) => (
        <li key={p.id} className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-baseline justify-between">
            <strong className="text-sm">{p.title}</strong>
            <span className="text-sm text-gray-700">${(p.price_cents / 100).toFixed(2)}</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">ID: {p.id}</div>
        </li>
      ))}
    </ul>
  );
}
