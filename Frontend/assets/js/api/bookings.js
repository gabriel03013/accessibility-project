import { request } from "./client.js";

const rentalPath = (id, suffix = "") =>
  `/rental-requests/${encodeURIComponent(id)}${suffix}`;

export const bookingsApi = {
  create: (payload) =>
    request("/rental-requests", { method: "POST", body: payload }),
  mine: (page = 0, size = 50) =>
    request(`/rental-requests/mine?page=${page}&size=${size}`),
  owner: (page = 0, size = 50) =>
    request(`/rental-requests/owner?page=${page}&size=${size}`),
  get: (id) => request(rentalPath(id)),
  proposals: (id) => request(rentalPath(id, "/proposals")),
  accept: (id) => request(rentalPath(id, "/accept"), { method: "PATCH" }),
  reject: (id, reason) =>
    request(rentalPath(id, "/reject"), { method: "PATCH", body: { reason } }),
  counter: (id, payload) =>
    request(rentalPath(id, "/counter"), { method: "POST", body: payload }),
  acceptProposal: (id, proposalId) =>
    request(
      rentalPath(id, `/proposals/${encodeURIComponent(proposalId)}/accept`),
      { method: "PATCH" },
    ),
  rejectProposal: (id, proposalId) =>
    request(
      rentalPath(id, `/proposals/${encodeURIComponent(proposalId)}/reject`),
      { method: "PATCH" },
    ),
  reservations: (page = 0, size = 50) =>
    request(`/reservations/mine?page=${page}&size=${size}`),
  reservation: (id) => request(`/reservations/${encodeURIComponent(id)}`),
  ownerReservations: (page = 0, size = 50) =>
    request(`/reservations/owner?page=${page}&size=${size}`),
};

export const paymentsApi = {
  pay: (reservationId) =>
    request("/payments", { method: "POST", body: { reservationId } }),
};

export const cartApi = {
  items: () => request("/cart"),
  add: (payload) => request("/cart/items", { method: "POST", body: payload }),
  remove: (itemId) => request(`/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" }),
  checkout: () => request("/cart/checkout", { method: "POST" }),
};
