import { client } from "./client";
import type { Category, CategoryCreateInput } from "../types";

export const categoriesApi = {
  getAll: () => client.get<Category[]>("/categories"),

  getById: (id: string) => client.get<Category>(`/categories/${id}`),

  create: (data: CategoryCreateInput) => client.post<Category>("/categories", data),

  update: (id: string, data: Partial<CategoryCreateInput>) =>
    client.put<Category>(`/categories/${id}`, data),

  delete: (id: string) => client.delete<{ message: string }>(`/categories/${id}`),
};
