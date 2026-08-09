import { client } from "./client";
import type { Modifier, ModifierCreateInput } from "../types";

export const modifiersApi = {
  getAll: () => client.get<Modifier[]>("/modifiers"),

  getById: (id: string) => client.get<Modifier>(`/modifiers/${id}`),

  create: (data: ModifierCreateInput) => client.post<Modifier>("/modifiers", data),

  update: (id: string, data: Partial<ModifierCreateInput>) =>
    client.put<Modifier>(`/modifiers/${id}`, data),

  delete: (id: string) => client.delete<{ message: string }>(`/modifiers/${id}`),
};
