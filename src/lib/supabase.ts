import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Strip the Authorization header for unauthenticated requests.
// supabase-js sends `Authorization: Bearer <anonKey>` even for anon requests,
// but PostgREST validates it as a JWT and rejects non-JWT publishable keys.
// The `apikey` header alone is sufficient for anonymous access.
const anonBearerToken = `Bearer ${supabaseKey}`;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: async (url: RequestInfo | URL, options?: RequestInit) => {
      const headers = new Headers(options?.headers);
      if (headers.get("Authorization") === anonBearerToken) {
        headers.delete("Authorization");
      }
      return fetch(url, { ...options, headers });
    },
  },
});

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderItem = {
  id: string;
  name: string;
  priceLabel: string;
  priceCents: number;
  quantity: number;
};

export type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
  status: OrderStatus;
  total_cents: number;
  items: OrderItem[];
};
