const apiRoot = "/api/v1";
const sessionKey = "partiuQuadra.session";
let refreshRequest;

export class ApiError extends Error {
  constructor(status, code, message, errors = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = Array.isArray(errors) ? errors : [];
  }
}

function readSession() {
  const value = sessionStorage.getItem(sessionKey);
  if (!value) {
    return null;
  }

  try {
    const session = JSON.parse(value);
    if (
      typeof session.accessToken !== "string" ||
      typeof session.expiresAt !== "number" ||
      typeof session.user !== "object"
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeSession(payload) {
  const session = {
    accessToken: payload.accessToken,
    expiresAt: Date.now() + Number(payload.expiresIn) * 1000,
    user: payload.user
  };
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("sessionchange", { detail: session.user }));
  return session;
}

export function clearSession() {
  sessionStorage.removeItem(sessionKey);
  window.dispatchEvent(new CustomEvent("sessionchange", { detail: null }));
}

export function getSession() {
  const session = readSession();
  if (!session || session.expiresAt <= Date.now() + 5000) {
    return null;
  }
  return session;
}

export function updateSessionUser(user) {
  const session = readSession();
  if (!session) {
    return null;
  }
  session.user = user;
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("sessionchange", { detail: user }));
  return session;
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json") && !contentType.includes("application/problem+json")) {
    if (!response.ok) {
      throw new ApiError(response.status, "UNEXPECTED_RESPONSE", "Não foi possível concluir a operação.");
    }
    return null;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(response.status, "INVALID_RESPONSE", "A resposta recebida não pôde ser processada.");
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof payload.code === "string" ? payload.code : "REQUEST_FAILED",
      typeof payload.detail === "string" ? payload.detail : "Não foi possível concluir a operação.",
      payload.errors
    );
  }

  return payload;
}

async function send(path, options, accessToken) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  const isFormData = options.body instanceof FormData;

  if (options.body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${apiRoot}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined
      ? undefined
      : isFormData
        ? options.body
        : JSON.stringify(options.body),
    credentials: "same-origin",
    signal: options.signal
  });
}

export async function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = send("/auth/refresh", { method: "POST" })
      .then(parseResponse)
      .then(writeSession)
      .catch((error) => {
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export async function request(path, options = {}) {
  const authenticated = options.auth !== false;
  let session = authenticated ? getSession() : null;

  if (authenticated && !session) {
    session = await refreshSession();
  }

  let response = await send(path, options, session?.accessToken);
  if (authenticated && response.status === 401 && options.retry !== false) {
    session = await refreshSession();
    response = await send(path, { ...options, retry: false }, session.accessToken);
  }
  return parseResponse(response);
}

export const api = {
  register(payload) {
    return request("/auth/register", { method: "POST", body: payload, auth: false }).then(writeSession);
  },
  login(payload) {
    return request("/auth/login", { method: "POST", body: payload, auth: false }).then(writeSession);
  },
  logout() {
    return request("/auth/logout", { method: "POST", auth: false })
      .catch(() => null)
      .finally(clearSession);
  },
  me() {
    return request("/auth/me");
  },
  updateProfile(payload) {
    return request("/auth/me", { method: "PATCH", body: payload }).then((user) => {
      updateSessionUser(user);
      return user;
    });
  },
  reference: {
    sports() {
      return request("/reference/sports", { auth: false });
    },
    amenities() {
      return request("/reference/amenities", { auth: false });
    }
  },
  media: {
    uploadImage(file) {
      const body = new FormData();
      body.append("file", file);
      return request("/media/images", { method: "POST", body });
    }
  },
  courts: {
    search(parameters = {}) {
      const query = new URLSearchParams();
      for (const [name, value] of Object.entries(parameters)) {
        if (value !== undefined && value !== null && value !== "") {
          query.set(name, String(value));
        }
      }
      return request(`/courts?${query.toString()}`, { auth: false });
    },
    get(slug) {
      return request(`/courts/${encodeURIComponent(slug)}`, { auth: false });
    },
    create(payload) {
      return request("/courts", { method: "POST", body: payload });
    },
    mine(page = 0, size = 20) {
      return request(`/courts/mine?page=${page}&size=${size}`);
    },
    saved(page = 0, size = 20) {
      return request(`/courts/saved?page=${page}&size=${size}`);
    },
    save(courtId) {
      return request(`/courts/${encodeURIComponent(courtId)}/saved`, { method: "POST" });
    },
    unsave(courtId) {
      return request(`/courts/${encodeURIComponent(courtId)}/saved`, { method: "DELETE" });
    }
  },
  bookings: {
    create(payload) {
      return request("/rental-requests", { method: "POST", body: payload });
    },
    mine(page = 0, size = 50) {
      return request(`/rental-requests/mine?page=${page}&size=${size}`);
    },
    owner(page = 0, size = 50) {
      return request(`/rental-requests/owner?page=${page}&size=${size}`);
    },
    get(requestId) {
      return request(`/rental-requests/${encodeURIComponent(requestId)}`);
    },
    proposals(requestId) {
      return request(`/rental-requests/${encodeURIComponent(requestId)}/proposals`);
    },
    accept(requestId) {
      return request(`/rental-requests/${encodeURIComponent(requestId)}/accept`, { method: "PATCH" });
    },
    reject(requestId, reason) {
      return request(`/rental-requests/${encodeURIComponent(requestId)}/reject`, {
        method: "PATCH",
        body: { reason }
      });
    },
    counter(requestId, payload) {
      return request(`/rental-requests/${encodeURIComponent(requestId)}/counter`, {
        method: "POST",
        body: payload
      });
    },
    acceptProposal(requestId, proposalId) {
      return request(
        `/rental-requests/${encodeURIComponent(requestId)}/proposals/${encodeURIComponent(proposalId)}/accept`,
        { method: "PATCH" }
      );
    },
    rejectProposal(requestId, proposalId) {
      return request(
        `/rental-requests/${encodeURIComponent(requestId)}/proposals/${encodeURIComponent(proposalId)}/reject`,
        { method: "PATCH" }
      );
    },
    reservations(page = 0, size = 50) {
      return request(`/reservations/mine?page=${page}&size=${size}`);
    },
    reservation(reservationId) {
      return request(`/reservations/${encodeURIComponent(reservationId)}`);
    },
    ownerReservations(page = 0, size = 50) {
      return request(`/reservations/owner?page=${page}&size=${size}`);
    }
  },
  payments: {
    pay(reservationId) {
      return request("/payments", {
        method: "POST",
        body: { reservationId }
      });
    }
  },
  teams: {
    search(parameters = {}) {
      const query = new URLSearchParams();
      for (const [name, value] of Object.entries(parameters)) {
        if (value !== undefined && value !== null && value !== "") {
          query.set(name, String(value));
        }
      }
      return request(`/teams?${query.toString()}`);
    },
    get(teamId) {
      return request(`/teams/${encodeURIComponent(teamId)}`);
    },
    mine() {
      return request("/teams/mine");
    },
    create(payload) {
      return request("/teams", { method: "POST", body: payload });
    },
    invitations() {
      return request("/teams/invitations/mine");
    },
    invite(teamId, payload) {
      return request(`/teams/${encodeURIComponent(teamId)}/invitations`, {
        method: "POST",
        body: payload
      });
    },
    acceptInvitation(invitationId) {
      return request(`/teams/invitations/${encodeURIComponent(invitationId)}/accept`, { method: "POST" });
    },
    declineInvitation(invitationId) {
      return request(`/teams/invitations/${encodeURIComponent(invitationId)}/decline`, { method: "PATCH" });
    },
    challenges() {
      return request("/teams/challenges/mine");
    },
    getChallenge(challengeId) {
      return request(`/teams/challenges/${encodeURIComponent(challengeId)}`);
    },
    createChallenge(teamId, payload) {
      return request(`/teams/${encodeURIComponent(teamId)}/challenges`, {
        method: "POST",
        body: payload
      });
    },
    challengeProposals(challengeId) {
      return request(`/teams/challenges/${encodeURIComponent(challengeId)}/proposals`);
    },
    propose(challengeId, payload) {
      return request(`/teams/challenges/${encodeURIComponent(challengeId)}/proposals`, {
        method: "POST",
        body: payload
      });
    },
    respond(challengeId, payload) {
      return request(`/teams/challenges/${encodeURIComponent(challengeId)}`, {
        method: "PATCH",
        body: payload
      });
    }
  },
  messages: {
    list(page = 0, size = 50) {
      return request(`/conversations?page=${page}&size=${size}`);
    },
    forRequest(requestId) {
      return request(`/conversations/rental-requests/${encodeURIComponent(requestId)}`, { method: "POST" });
    },
    forChallenge(challengeId) {
      return request(`/conversations/challenges/${encodeURIComponent(challengeId)}`, { method: "POST" });
    },
    get(conversationId, page = 0, size = 100) {
      return request(`/conversations/${encodeURIComponent(conversationId)}/messages?page=${page}&size=${size}`);
    },
    send(conversationId, body) {
      return request(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST",
        body: { body }
      });
    }
  }
};
