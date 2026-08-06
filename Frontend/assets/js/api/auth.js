import {
  clearSession,
  request,
  updateSessionUser,
  writeSession,
} from "./client.js";

export const authApi = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    }).then(writeSession),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: payload, auth: false }).then(
      writeSession,
    ),
  logout: () =>
    request("/auth/logout", { method: "POST", auth: false })
      .catch(() => null)
      .finally(clearSession),
  me: () => request("/auth/me"),
  updateProfile: (payload) =>
    request("/auth/me", { method: "PATCH", body: payload }).then((user) => {
      updateSessionUser(user);
      return user;
    }),
};

export const referenceApi = {
  sports: () => request("/reference/sports", { auth: false }),
  amenities: () => request("/reference/amenities", { auth: false }),
};

export const mediaApi = {
  uploadImage(file) {
    const body = new FormData();
    body.append("file", file);
    return request("/media/images", { method: "POST", body });
  },
};
