import { client } from "./client";
import type { Item, ItemCreateInput } from "../types";

export const itemsApi = {
  getAll: (params?: { category?: string; status?: string; search?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString()
      : "";
    return client.get<Item[]>(`/items${qs}`);
  },

  getById: (id: string) => client.get<Item>(`/items/${id}`),

  create: (data: ItemCreateInput) => client.post<Item>("/items", data),

  update: (id: string, data: Partial<ItemCreateInput>) =>
    client.put<Item>(`/items/${id}`, data),

  delete: (id: string) => client.delete<{ message: string }>(`/items/${id}`),

  deleteMany: (ids: string[]) =>
    client.post<{ message: string }>("/items/bulk-delete", { ids }),

  importCSV: (items: Omit<Item, "_id" | "createdAt" | "updatedAt">[]) =>
    client.post<{ imported: number }>("/items/import", { items }),
};
