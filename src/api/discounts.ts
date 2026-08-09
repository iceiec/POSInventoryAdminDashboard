import { client } from "./client";
import type { Discount, DiscountCreateInput } from "../types";

export const discountsApi = {
  getAll: () => client.get<Discount[]>("/discounts"),

  getById: (id: string) => client.get<Discount>(`/discounts/${id}`),

  create: (data: DiscountCreateInput) => client.post<Discount>("/discounts", data),

  update: (id: string, data: Partial<DiscountCreateInput & { status: Discount["status"] }>) =>
    client.put<Discount>(`/discounts/${id}`, data),

  toggleStatus: (id: string) =>
    client.patch<Discount>(`/discounts/${id}/toggle`, {}),

  delete: (id: string) => client.delete<{ message: string }>(`/discounts/${id}`),
};
