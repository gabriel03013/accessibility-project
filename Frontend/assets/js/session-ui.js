import { api, getSession, refreshSession } from "./api.js?v=20260727-9";
import { createElement } from "./dom.js?v=20260727-9";
import { initials } from "./format.js?v=20260727-9";

const ownerPages = new Set([
  "ownerAccepted",
  "ownerAgenda",
  "ownerCourts",
  "ownerDashboard",
  "ownerRequest",
  "ownerRequests",
  "rejectRequest",
  "counterRequest",
  "createCourt"
]);

const authenticationPages = new Set(["login", "register"]);

const playerNavigation = [
  {
    key: "explore",
    href: "/pages/buscar/",
    label: "Explorar quadras",
    icon: "fa-solid fa-magnifying-glass"
  },
  { key: "teams", href: "/pages/times/", label: "Times" },
  { key: "bookings", href: "/pages/minhas-reservas/", label: "Reservas" },
  { key: "saved", href: "/pages/salvas/", label: "Salvas" },
  { key: "messages", href: "/pages/mensagens/", label: "Mensagens" }
];

const ownerNavigation = [
  { key: "dashboard", href: "/pages/painel-proprietario/", label: "Visão geral" },
  { key: "requests", href: "/pages/solicitacoes/", label: "Solicitações" },
  { key: "schedule", href: "/pages/agenda-proprietario/", label: "Agenda" },
  { key: "courts", href: "/pages/meus-anuncios/", label: "Quadras" },
  { key: "messages", href: "/pages/mensagens/?mode=owner", label: "Mensagens" }
];

const playerMobileNavigation = [
  ...playerNavigation,
  { key: "profile", href: "/pages/perfil/", label: "Perfil" }
];

const playerPageKeys = {
  home: "explore",
  search: "explore",
  court: "explore",
  bookingRequest: "explore",
  requestSent: "explore",
  teams: "teams",
  createTeam: "teams",
  team: "teams",
  inviteMembers: "teams",
  discoverTeams: "teams",
  challengeTeam: "teams",
  invitation: "teams",
  challengeProposal: "teams",
  challengeResponse: "teams",
  myBookings: "bookings",
  paymentChoice: "bookings",
  confirmation: "bookings",
  counterResponse: "bookings",
  savedCourts: "saved",
  messages: "messages",
  chat: "messages",
  profile: "profile"
};

const ownerPageKeys = {
  ownerDashboard: "dashboard",
  ownerRequests: "requests",
  ownerRequest: "requests",
  rejectRequest: "requests",
  counterRequest: "requests",
  ownerAccepted: "requests",
  ownerAgenda: "schedule",
  ownerCourts: "courts",
  createCourt: "courts",
  messages: "messages",
  chat: "messages"
};

let unreadTimer;

function isOwner(user) {
  return user?.roles?.includes("OWNER") || user?.roles?.includes("ADMIN");
}

function isOwnerMode(user) {
  const page = document.body.dataset.page;
  if (ownerPages.has(page)) {
    return true;
  }
  const parameters = new URLSearchParams(window.location.search);
  return isOwner(user) && parameters.get("mode") === "owner";
}

function brand(ownerMode) {
  const symbol = createElement("span", { className: "brand-symbol" }, createElement("i", {
    className: "fa-solid fa-location-crosshairs",
    attributes: { "aria-hidden": "true" }
  }));
  const name = createElement("span", {}, [
    "partiu quadra",
    ownerMode
      ? createElement("small", { className: "muted", text: " · proprietário" })
      : null
  ].filter(Boolean));
  return createElement("a", {
    className: "brand-mark",
    attributes: {
      href: ownerMode ? "/pages/painel-proprietario/" : "/pages/inicio/",
      "aria-label": ownerMode
        ? "Partiu Quadra, área do proprietário"
        : "Partiu Quadra, página inicial"
    }
  }, [symbol, name]);
}

function navigationLink(item, selectedKey) {
  const children = [];
  if (item.icon) {
    children.push(createElement("i", {
      className: item.icon,
      attributes: { "aria-hidden": "true" }
    }));
  }
  children.push(item.label);
  return createElement("a", {
    className: item.key === "explore" ? "nav-item nav-explore" : "nav-item",
    attributes: {
      href: item.href,
      "aria-current": item.key === selectedKey ? "page" : null,
      "data-nav-key": item.key
    }
  }, children);
}

function mobileNavigationLink(item, selectedKey) {
  const children = [];
  if (item.icon) {
    children.push(createElement("i", {
      className: item.icon,
      attributes: { "aria-hidden": "true" }
    }));
  }
  children.push(item.key === "explore" ? "Quadras" : item.label);
  return createElement("a", {
    className: "mobile-link",
    attributes: {
      href: item.href,
      "aria-current": item.key === selectedKey ? "page" : null,
      "data-nav-key": item.key
    }
  }, children);
}

function accountLink(user) {
  if (user) {
    return createElement("a", {
      className: "avatar",
      attributes: {
        href: "/pages/perfil/",
        "aria-label": `Abrir perfil de ${user.displayName}`
      },
      text: initials(user.displayName)
    });
  }
  return createElement("a", {
    className: "avatar avatar-login",
    attributes: {
      href: `/pages/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      "aria-label": "Entrar na sua conta"
    },
    text: "Entrar"
  });
}

function renderHeader(user) {
  const page = document.body.dataset.page;
  if (authenticationPages.has(page)) {
    return;
  }
  const shell = document.querySelector(".app-header .nav-shell");
  if (!shell) {
    return;
  }
  const ownerMode = isOwnerMode(user);
  const items = ownerMode ? ownerNavigation : playerNavigation;
  const mobileItems = ownerMode ? ownerNavigation : playerMobileNavigation;
  const pageKeys = ownerMode ? ownerPageKeys : playerPageKeys;
  const navigation = createElement("nav", {
    className: "desktop-menu",
    attributes: {
      "aria-label": ownerMode ? "Navegação do proprietário" : "Navegação principal"
    }
  }, items.map((item) => navigationLink(item, pageKeys[page])));
  const actions = createElement("div", { className: "nav-actions" });
  if (ownerMode) {
    actions.append(createElement("a", {
      className: "btn btn-secondary",
      attributes: { href: "/pages/inicio/" },
      text: "Modo jogador"
    }));
  } else if (isOwner(user)) {
    actions.append(createElement("a", {
      className: "btn btn-secondary",
      attributes: { href: "/pages/painel-proprietario/" },
      text: "Área do proprietário"
    }));
  }
  actions.append(accountLink(user));
  shell.replaceChildren(brand(ownerMode), navigation, actions);
  for (const mobileNavigation of document.querySelectorAll(".mobile-nav")) {
    mobileNavigation.className = ownerMode ? "mobile-nav owner-nav" : "mobile-nav";
    mobileNavigation.setAttribute(
      "aria-label",
      ownerMode ? "Navegação móvel do proprietário" : "Navegação móvel"
    );
    mobileNavigation.replaceChildren(
      ...mobileItems.map((item) => mobileNavigationLink(item, pageKeys[page]))
    );
  }
}

async function refreshUnreadNavigation(user) {
  for (const dot of document.querySelectorAll(".nav-unread-dot")) {
    dot.remove();
  }
  if (!user) {
    return;
  }
  try {
    const page = await api.messages.list(0, 100);
    if (!page.content.some((conversation) => conversation.unread)) {
      return;
    }
    for (const link of document.querySelectorAll("[data-nav-key='messages']")) {
      link.append(createElement("span", {
        className: "nav-unread-dot",
        attributes: {
          "aria-label": "Há mensagens novas"
        }
      }));
    }
  } catch {
  }
}

function startUnreadPolling(user) {
  if (unreadTimer) {
    window.clearInterval(unreadTimer);
  }
  refreshUnreadNavigation(user);
  if (!user) {
    return;
  }
  unreadTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      refreshUnreadNavigation(user);
    }
  }, 10000);
}

function updateNavigation(user) {
  renderHeader(user);
  startUnreadPolling(user);
}

export async function initializeSessionUi() {
  let session = getSession();
  updateNavigation(session?.user || null);
  if (!session) {
    try {
      session = await refreshSession();
    } catch {
      session = null;
    }
    updateNavigation(session?.user || null);
  }
  window.addEventListener("sessionchange", (event) => updateNavigation(event.detail));
  window.addEventListener("beforeunload", () => {
    if (unreadTimer) {
      window.clearInterval(unreadTimer);
    }
  }, { once: true });

  for (const control of document.querySelectorAll("[data-logout]")) {
    control.addEventListener("click", async (event) => {
      event.preventDefault();
      control.setAttribute("aria-busy", "true");
      await api.logout();
      window.location.assign("/pages/inicio/");
    });
  }
}
