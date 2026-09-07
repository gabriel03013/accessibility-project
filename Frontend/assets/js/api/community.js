import { queryString, request } from "./client.js";

const teamPath = (id, suffix = "") =>
  `/teams/${encodeURIComponent(id)}${suffix}`;

export const teamsApi = {
  search: (parameters = {}) =>
    request(`/teams?${queryString(parameters)}`, { auth: false }),
  get: (id) => request(teamPath(id), { auth: false }),
  mine: () => request("/teams/mine"),
  create: (payload) => request("/teams", { method: "POST", body: payload }),
  invitations: () => request("/teams/invitations/mine"),
  invite: (id, payload) =>
    request(teamPath(id, "/invitations"), { method: "POST", body: payload }),
  acceptInvitation: (id) =>
    request(`/teams/invitations/${encodeURIComponent(id)}/accept`, {
      method: "POST",
    }),
  declineInvitation: (id) =>
    request(`/teams/invitations/${encodeURIComponent(id)}/decline`, {
      method: "PATCH",
    }),
  challenges: () => request("/teams/challenges/mine"),
  getChallenge: (id) => request(`/teams/challenges/${encodeURIComponent(id)}`),
  createChallenge: (id, payload) =>
    request(teamPath(id, "/challenges"), { method: "POST", body: payload }),
  challengeProposals: (id) =>
    request(`/teams/challenges/${encodeURIComponent(id)}/proposals`),
  propose: (id, payload) =>
    request(`/teams/challenges/${encodeURIComponent(id)}/proposals`, {
      method: "POST",
      body: payload,
    }),
  respond: (id, payload) =>
    request(`/teams/challenges/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    }),
};

export const messagesApi = {
  list: (page = 0, size = 50) =>
    request(`/conversations?page=${page}&size=${size}`),
  forRequest: (id) =>
    request(`/conversations/rental-requests/${encodeURIComponent(id)}`, {
      method: "POST",
    }),
  forChallenge: (id) =>
    request(`/conversations/challenges/${encodeURIComponent(id)}`, {
      method: "POST",
    }),
  get: (id, page = 0, size = 100) =>
    request(
      `/conversations/${encodeURIComponent(id)}/messages?page=${page}&size=${size}`,
    ),
  send: (id, body) =>
    request(`/conversations/${encodeURIComponent(id)}/messages`, {
      method: "POST",
      body: { body },
    }),
};
