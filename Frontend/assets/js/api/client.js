const API_ROOT = "/api/v1";
const SESSION_COOKIE = "partiu_session";
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

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.substring(prefix.length));
    }
  }
  return null;
}

function setCookie(name, value, maxAgeSeconds) {
  if (typeof document === "undefined") return;
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  if (typeof maxAgeSeconds === "number") {
    cookie += `; max-age=${maxAgeSeconds}`;
  }
  if (typeof window !== "undefined" && window.location?.protocol === "https:") {
    cookie += "; Secure";
  }
  document.cookie = cookie;
}

function deleteCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function readSession() {
  try {
    const raw = getCookie(SESSION_COOKIE);
    if (!raw) return null;
    const session = JSON.parse(raw);
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

// salva o token e dados da sessao no cookie e notifica o app
export function writeSession(payload) {
  const expiresInSeconds = Number(payload.expiresIn) || 3600;
  const session = {
    accessToken: payload.accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
    user: payload.user,
  };
  setCookie(SESSION_COOKIE, JSON.stringify(session), 60 * 60 * 24 * 7);
  window.dispatchEvent(
    new CustomEvent("sessionchange", { detail: session.user }),
  );
  return session;
}

export function clearSession() {
  deleteCookie(SESSION_COOKIE);
  window.dispatchEvent(new CustomEvent("sessionchange", { detail: null }));
}

// checa se o token ainda vale dando 5s de margem pra nao expirar no meio da requisicao
export function getSession() {
  const session = readSession();
  return session && session.expiresAt > Date.now() + 5000 ? session : null;
}

export function updateSessionUser(user) {
  const session = readSession();
  if (!session) return null;
  session.user = user;
  setCookie(SESSION_COOKIE, JSON.stringify(session), 60 * 60 * 24 * 7);
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
    credentials: "include",
    signal: options.signal,
  });
}

// reaproveita a promise de refresh pra nao disparar varias vezes se vierem chamadas paralelas
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

// controla auth automatica: renova antes se precisar, trata 401 e retenta uma vez
export async function request(path, options = {}) {
  const requireAuth = options.auth !== false;
  let session = getSession();

  if (requireAuth && !session) {
    try {
      session = await refreshSession();
    } catch {
      // se nao conseguir renovar joga pro login e trava a promise pra nao estourar erro em cascata
      window.location.href = "/pages/autenticacao/entrar/entrar-na-conta.html";
      return new Promise(() => {});
    }
  }

  let response = await send(path, options, session?.accessToken);
  if (requireAuth && response.status === 401 && options.retry !== false) {
    try {
      session = await refreshSession();
    } catch {
      window.location.href = "/pages/autenticacao/entrar/entrar-na-conta.html";
      return new Promise(() => {});
    }
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
