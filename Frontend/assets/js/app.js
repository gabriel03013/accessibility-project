import { initializePreferences } from "./preferences.js";
import { renderNavigation } from "./navigation.js";
import { initializeInteractions } from "./interactions.js";
import { renderUserData, initializeUserAuthHandlers, ensureUserSession } from "./user-session.js";

initializePreferences();
ensureUserSession();
renderNavigation();
initializeInteractions();
renderUserData();
initializeUserAuthHandlers();

