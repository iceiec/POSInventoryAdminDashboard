import { client } from "./client";
import type { Analytics } from "../types";

export const analyticsApi = {
  getSummary: (params: { startDate: string; endDate: string }) => {
    const qs = new URLSearchParams(params).toString();
    return client.get<Analytics>(`/analytics/summary?${qs}`);
  },
};
