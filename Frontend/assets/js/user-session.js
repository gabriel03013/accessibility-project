import { getSession, writeSession, updateSessionUser } from "./api/client.js";

const DEFAULT_USER = {
  name: "Gabriel Silva",
  email: "gabriel.silva@exemplo.com",
  phone: "(11) 98765-4321",
  city: "São Paulo",
  sport: "Vôlei",
  level: "Intermediário",
};

export function ensureUserSession() {
  let session = getSession();
  if (!session || !session.user) {
    session = writeSession({
      accessToken: "demo-token",
      expiresIn: 86400 * 30,
      user: { ...DEFAULT_USER },
    });
  }
  return session.user;
}

export function renderUserData() {
  const session = getSession();
  const user = session?.user || DEFAULT_USER;

  // Update headings like "Olá, Usuário" or "Olá, [Nome]"
  document.querySelectorAll("h1, h2, h3").forEach((heading) => {
    if (heading.textContent.includes("Olá,")) {
      heading.textContent = `Olá, ${user.name.split(" ")[0]}`;
    }
  });

  // Update user sidebar card in account area
  document.querySelectorAll(".user-card strong").forEach((el) => {
    el.textContent = user.name;
  });
  document.querySelectorAll(".user-card .muted").forEach((el) => {
    el.textContent = `${user.sport || "Vôlei"} · ${user.level || "Intermediário"}`;
  });

  // Populate personal details form if present
  const nameInput = document.querySelector('input[name="nome"]');
  const emailInput = document.querySelector('input[name="email"]');
  const phoneInput = document.querySelector('input[name="telefone"]');
  const cityInput = document.querySelector('input[name="cidade"]');

  if (document.body.dataset.section === "account") {
    if (nameInput && (nameInput.value === "Usuário" || !nameInput.value)) nameInput.value = user.name;
    if (emailInput && (emailInput.value.includes("usuario@") || !emailInput.value)) emailInput.value = user.email;
    if (phoneInput && (phoneInput.value.includes("99999-9999") || !phoneInput.value)) phoneInput.value = user.phone;
    if (cityInput && !cityInput.value) cityInput.value = user.city || "São Paulo";
  }
}

export function initializeUserAuthHandlers() {
  // Login form handler
  const authForm = document.querySelector(".auth-form");
  if (authForm) {
    authForm.addEventListener("submit", () => {
      const emailVal = authForm.querySelector('input[name="email"]')?.value;
      const nameVal = authForm.querySelector('input[name="nome"]')?.value;
      const phoneVal = authForm.querySelector('input[name="telefone"]')?.value;

      let name = nameVal;
      if (!name && emailVal) {
        const parts = emailVal.split("@")[0].split(/[\._-]/);
        name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      }
      if (!name) name = DEFAULT_USER.name;

      writeSession({
        accessToken: "user-token-" + Date.now(),
        expiresIn: 86400 * 30,
        user: {
          ...DEFAULT_USER,
          name,
          email: emailVal || DEFAULT_USER.email,
          phone: phoneVal || DEFAULT_USER.phone,
        },
      });
    });
  }

  // Personal data edit form handler
  const formPanel = document.querySelector(".form-panel");
  if (formPanel) {
    formPanel.addEventListener("submit", () => {
      const nameVal = formPanel.querySelector('input[name="nome"]')?.value;
      const emailVal = formPanel.querySelector('input[name="email"]')?.value;
      const phoneVal = formPanel.querySelector('input[name="telefone"]')?.value;
      const cityVal = formPanel.querySelector('input[name="cidade"]')?.value;
      const sportVal = formPanel.querySelector('select[name="esporte"]')?.value;

      const current = getSession()?.user || DEFAULT_USER;
      updateSessionUser({
        ...current,
        name: nameVal || current.name,
        email: emailVal || current.email,
        phone: phoneVal || current.phone,
        city: cityVal || current.city,
        sport: sportVal || current.sport,
      });
      renderUserData();
    });
  }
}
