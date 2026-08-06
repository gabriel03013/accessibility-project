const API_ROOT = "/api/v1";
const SESSION_KEY = "partiuquadra:session";
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
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (
      !session?.accessToken ||
      typeof session.expiresAt !== "number" ||
      !session.user
    )
      return null;
    return session;
  } catch {
    return null;
  }
}

export function writeSession(payload) {
  const session = {
    accessToken: payload.accessToken,
    expiresAt: Date.now() + Number(payload.expiresIn) * 1000,
    user: payload.user,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(
    new CustomEvent("sessionchange", { detail: session.user }),
  );
  return session;
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent("sessionchange", { detail: null }));
}

export function getSession() {
  const session = readSession();
  return session && session.expiresAt > Date.now() + 5000 ? session : null;
}

export function updateSessionUser(user) {
  const session = readSession();
  if (!session) return null;
  session.user = user;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("sessionchange", { detail: user }));
  return session;
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("json")) {
    if (!response.ok)
      throw new ApiError(
        response.status,
        "UNEXPECTED_RESPONSE",
        "Não foi possível concluir a operação.",
      );
    return null;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "A resposta recebida não pôde ser processada.",
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof payload.code === "string" ? payload.code : "REQUEST_FAILED",
      typeof payload.detail === "string"
        ? payload.detail
        : "Não foi possível concluir a operação.",
      payload.errors,
    );
  }
  return payload;
}

async function send(path, options, accessToken) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  headers.set("Accept", "application/json");
  if (options.body !== undefined && !isFormData)
    headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(`${API_ROOT}${path}`, {
    method: options.method || "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
        : isFormData
          ? options.body
          : JSON.stringify(options.body),
    credentials: "same-origin",
    signal: options.signal,
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
  if (authenticated && !session) session = await refreshSession();

  let response = await send(path, options, session?.accessToken);
  if (authenticated && response.status === 401 && options.retry !== false) {
    session = await refreshSession();
    response = await send(
      path,
      { ...options, retry: false },
      session.accessToken,
    );
  }
  return parseResponse(response);
}

export function queryString(parameters = {}) {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== "")
      query.set(name, String(value));
  }
  return query.toString();
}
