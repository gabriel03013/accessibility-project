import { element, icon } from "./dom.js";

const STORAGE_KEY = "partiuquadra:preferences";
const defaults = {
  theme: "system",
  contrast: false,
  largeText: false,
  reduceMotion: false,
};

function readPreferences() {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    };
  } catch {
    return { ...defaults };
  }
}

function applyPreferences(preferences) {
  const root = document.documentElement;

  if (preferences.theme && preferences.theme !== "system") {
    root.dataset.theme = preferences.theme;
  } else {
    root.removeAttribute("data-theme");
  }

  if (preferences.contrast) {
    root.dataset.contrast = "more";
  } else {
    root.removeAttribute("data-contrast");
  }

  if (preferences.largeText) {
    root.dataset.fontSize = "large";
  } else {
    root.removeAttribute("data-font-size");
  }

  if (preferences.reduceMotion) {
    root.dataset.motion = "reduce";
  } else {
    root.removeAttribute("data-motion");
  }
}

function save(preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  applyPreferences(preferences);
}

function themeOption(value, label, preferences) {
  const input = element("input", {
    attributes: { type: "radio", name: "appearance", value },
  });
  input.checked = preferences.theme === value;
  input.addEventListener("change", () => {
    preferences.theme = value;
    save(preferences);
  });

  return element("label", { className: "segmented-option" }, [
    input,
    element("span", { text: label }),
  ]);
}

function preferenceToggle(key, label, description, preferences) {
  const input = element("input", { attributes: { type: "checkbox" } });
  input.checked = preferences[key];
  input.addEventListener("change", () => {
    preferences[key] = input.checked;
    save(preferences);
  });

  return element("label", { className: "preference-toggle" }, [
    element("span", {}, [
      element("strong", { text: label }),
      element("small", { text: description }),
    ]),
    input,
  ]);
}

export function initializePreferences() {
  applyPreferences(readPreferences());
}

export function createPreferencesControl() {
  const preferences = readPreferences();
  const details = element("details", { className: "preferences" });
  const summary = element(
    "summary",
    {
      className: "icon-button",
      attributes: {
        "aria-label": "Abrir preferências de acessibilidade",
        title: "Acessibilidade",
      },
    },
    icon("◐"),
  );

  const themeOptions = [
    themeOption("system", "Automático", preferences),
    themeOption("light", "Claro", preferences),
    themeOption("dark", "Escuro", preferences),
  ];

  const panel = element(
    "div",
    {
      className: "preferences-panel",
      attributes: {
        role: "group",
        "aria-label": "Preferências de acessibilidade",
      },
    },
    [
      element("div", {}, [
        element("strong", { text: "Ajuste do seu jeito" }),
        element("p", { text: "As escolhas ficam salvas neste navegador." }),
      ]),
      element("fieldset", { className: "preference-group" }, [
        element("legend", {
          className: "preference-legend",
          text: "Aparência",
        }),
        element("div", { className: "segmented-control" }, themeOptions),
      ]),
      preferenceToggle(
        "contrast",
        "Contraste reforçado",
        "Realça textos e contornos.",
        preferences,
      ),
      preferenceToggle(
        "largeText",
        "Texto maior",
        "Amplia toda a interface.",
        preferences,
      ),
      preferenceToggle(
        "reduceMotion",
        "Reduzir movimento",
        "Evita animações desnecessárias.",
        preferences,
      ),
      element("a", {
        className: "link",
        attributes: {
          href: "/pages/conta/acessibilidade/preferencias-de-acessibilidade.html",
        },
        text: "Conheça todos os recursos",
      }),
    ],
  );

  details.append(summary, panel);
  details.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !details.open) return;
    details.open = false;
    summary.focus();
  });

  document.addEventListener("click", (event) => {
    if (details.open && !details.contains(event.target)) details.open = false;
  });

  return details;
}
