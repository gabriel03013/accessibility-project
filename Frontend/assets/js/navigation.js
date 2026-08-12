import { createPreferencesControl } from "./preferences.js";
import { element } from "./dom.js";
import { getSession } from "./api/client.js";

const links = [
  { key: "home", label: "Início", href: "/pages/inicio/pagina-inicial.html" },
  {
    key: "explore",
    label: "Explorar",
    href: "/pages/explorar/explorar-quadras-e-partidas.html",
  },
  {
    key: "ranking",
    label: "Times e ranking",
    href: "/pages/ranking/times-e-ranking.html",
  },
  {
    key: "owner",
    label: "Anuncie sua quadra",
    href: "/pages/proprietario/meus-espacos.html",
  },
];

function brand() {
  return element(
    "a",
    {
      className: "brand",
      attributes: {
        href: "/pages/inicio/pagina-inicial.html",
        "aria-label": "Partiu Quadra, página inicial",
      },
    },
    [
      element("img", {
        className: "brand-logo",
        attributes: {
          src: "/assets/images/logo.png",
          alt: "Logo Partiu Quadra",
        },
      }),
      element("span", { className: "brand-text", text: "Partiu Quadra" }),
    ],
  );
}

function navLink(item, current) {
  return element("a", {
    className: "nav-link",
    attributes: {
      href: item.href,
      "aria-current": item.key === current ? "page" : null,
    },
    text: item.label,
  });
}

function renderMinimalHeader(header) {
  const actions = element("div", { className: "header-actions" }, [
    createPreferencesControl(),
    element("a", {
      className: "btn btn-secondary",
      attributes: { href: "/pages/inicio/pagina-inicial.html" },
      text: "Voltar ao início",
    }),
  ]);
  header.replaceChildren(
    element("div", { className: "header-inner" }, [brand(), actions]),
  );
}

function renderMobileNav(current) {
  const defaultMobileLinks = [
    links[0],
    links[1],
    links[2],
    {
      key: "bookings",
      label: "Reservas",
      href: "/pages/conta/reservas/minhas-reservas.html",
    },
    {
      key: "account",
      label: "Conta",
      href: "/pages/conta/painel-da-conta.html",
    },
  ];
  const mobileLinks =
    current === "owner"
      ? [
          links[0],
          links[1],
          { ...links[3], label: "Espaços" },
          defaultMobileLinks[3],
          defaultMobileLinks[4],
        ]
      : defaultMobileLinks;
  const nav = element("nav", {
    className: "mobile-nav",
    attributes: { "aria-label": "Navegação móvel" },
  });

  for (const item of mobileLinks) {
    nav.append(
      element("a", {
        attributes: {
          href: item.href,
          "data-nav": item.key,
          "aria-current": item.key === current ? "page" : null,
        },
        text: item.label,
      }),
    );
  }

  document.body.append(nav);
}

export function renderNavigation() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const current = document.body.dataset.section || "";
  if (document.body.dataset.shell === "minimal") {
    renderMinimalHeader(header);
    return;
  }

  const nav = element("nav", {
    className: "desktop-nav",
    attributes: { "aria-label": "Navegação principal" },
  });
  links.forEach((item) => nav.append(navLink(item, current)));

  const actions = element("div", { className: "header-actions" }, [
    createPreferencesControl(),
  ]);
  const privateArea = ["account", "bookings", "owner"].includes(current);
  const loggedIn = !!getSession();

  actions.append(
    element("a", {
      className: "account-link",
      attributes: { href: "/pages/checkout/carrinho/carrinho-de-reservas.html" },
      text: "Carrinho",
    }),
  );

  if (privateArea || loggedIn) {
    if (current === "owner") {
      actions.append(
        element("a", {
          className: "account-link",
          attributes: { href: "/pages/conta/painel-da-conta.html" },
          text: "Modo jogador",
        }),
      );
    }
    actions.append(
      element("a", {
        className: "btn btn-primary",
        attributes: { href: "/pages/conta/painel-da-conta.html" },
        text: "Minha conta",
      }),
    );
  } else {
    actions.append(
      element("a", {
        className: "account-link",
        attributes: {
          href: "/pages/autenticacao/entrar/entrar-na-conta.html",
          "aria-label": "Entrar na sua conta",
        },
        text: "Entrar",
      }),
      element("a", {
        className: "btn btn-primary",
        attributes: { href: "/pages/autenticacao/cadastro/criar-conta.html" },
        text: "Criar conta",
      }),
    );
  }

  header.replaceChildren(
    element("div", { className: "header-inner" }, [brand(), nav, actions]),
  );
  renderMobileNav(current);
}
