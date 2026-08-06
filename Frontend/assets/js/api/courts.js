import { queryString, request } from "./client.js";

export const courtsApi = {
  search: (parameters = {}) =>
    request(`/courts?${queryString(parameters)}`, { auth: false }),
  get: (slug) =>
    request(`/courts/${encodeURIComponent(slug)}`, { auth: false }),
  create: (payload) => request("/courts", { method: "POST", body: payload }),
  mine: (page = 0, size = 20) =>
    request(`/courts/mine?page=${page}&size=${size}`),
  saved: (page = 0, size = 20) =>
    request(`/courts/saved?page=${page}&size=${size}`),
  save: (courtId) =>
    request(`/courts/${encodeURIComponent(courtId)}/saved`, { method: "POST" }),
  unsave: (courtId) =>
    request(`/courts/${encodeURIComponent(courtId)}/saved`, {
      method: "DELETE",
    }),
};
