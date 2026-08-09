import { client } from "./client";
import type { Sale, CartItem, Discount } from "../types";

export interface CompleteSalePayload {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountLabel?: string;
  total: number;
  paymentMethod: "cash" | "card" | "wallet";
  amountReceived?: number;
  change?: number;
  customerName?: string;
}

export const salesApi = {
  complete: (data: CompleteSalePayload) =>
    client.post<Sale>("/sales", data),

  getAll: (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const qs = params
      ? "?" + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return client.get<{ sales: Sale[]; total: number; page: number }>(`/sales${qs}`);
  },

  getById: (id: string) => client.get<Sale>(`/sales/${id}`),
};
