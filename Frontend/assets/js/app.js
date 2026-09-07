import { initializePreferences } from "./preferences.js";
import { renderNavigation } from "./navigation.js";
import { initializeInteractions } from "./interactions.js";
import { renderUserData, initializeUserAuthHandlers } from "./user-session.js";
import { initializeDynamicPages } from "./dynamic-pages.js";

initializePreferences();
renderNavigation();
initializeInteractions();
renderUserData();
initializeUserAuthHandlers();
initializeDynamicPages();

