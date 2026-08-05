import { authApi, mediaApi, referenceApi } from "./api/auth.js";
import { bookingsApi, paymentsApi } from "./api/bookings.js";
import { teamsApi, messagesApi } from "./api/community.js";
import { courtsApi } from "./api/courts.js";

export { ApiError, clearSession, getSession, request } from "./api/client.js";

export const api = {
  register: authApi.register,
  login: authApi.login,
  logout: authApi.logout,
  me: authApi.me,
  updateProfile: authApi.updateProfile,
  reference: referenceApi,
  media: mediaApi,
  courts: courtsApi,
  bookings: bookingsApi,
  payments: paymentsApi,
  teams: teamsApi,
  messages: messagesApi,
};
