import { getSession } from "./api/client.js";
import { api } from "./api.js";
import { announce } from "./dom.js";

export function isAuthenticated() {
  return getSession() !== null;
}

export function getCurrentUser() {
  return getSession()?.user || null;
}

export function renderUserData() {
  const user = getCurrentUser();
  if (!user) return;

  document.querySelectorAll("h1, h2, h3").forEach((heading) => {
    if (heading.textContent.includes("Olá,")) {
      const firstName = (user.displayName || user.name || "").split(" ")[0];
      heading.textContent = `Olá, ${firstName || "Jogador"}`;
    }
  });

  document.querySelectorAll(".user-card strong").forEach((el) => {
    el.textContent = user.displayName || user.name || "";
  });
  document.querySelectorAll(".user-card .muted").forEach((el) => {
    const sports = Array.isArray(user.favoriteSports)
      ? user.favoriteSports.map((s) => s.name).join(", ")
      : user.sport || "";
    el.textContent = sports || "Nenhum esporte favorito";
  });

  const nameInput = document.querySelector('input[name="nome"]');
  const usernameInput = document.querySelector('input[name="username"]');
  const emailInput = document.querySelector('input[name="email"]');
  const phoneInput = document.querySelector('input[name="telefone"]');

  if (document.body.dataset.section === "account") {
    if (nameInput) nameInput.value = user.displayName || user.name || "";
    if (usernameInput) usernameInput.value = user.username || "";
    if (emailInput) emailInput.value = user.email || "";
    if (phoneInput) phoneInput.value = user.phone || "";
  }
}

function showAuthError(form, message) {
  const errorDiv =
    form.closest(".auth-form-shell")?.querySelector(".auth-error") ||
    form.parentElement?.querySelector(".auth-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.hidden = false;
  }
}

function clearAuthError(form) {
  const errorDiv =
    form.closest(".auth-form-shell")?.querySelector(".auth-error") ||
    form.parentElement?.querySelector(".auth-error");
  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.hidden = true;
  }
}

function setFormLoading(form, loading) {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = loading;
    if (loading) {
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = "Aguarde…";
    } else {
      submitBtn.textContent = submitBtn.dataset.originalText || submitBtn.textContent;
    }
  }
}

function initPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    const inputId = button.getAttribute("aria-controls");
    const input = inputId ? document.getElementById(inputId) : null;
    if (!input) return;

    button.addEventListener("click", () => {
      const showingPassword = input.type === "password";
      input.type = showingPassword ? "text" : "password";
      button.textContent = showingPassword ? "Ocultar" : "Mostrar";
      button.setAttribute("aria-pressed", String(showingPassword));
      button.setAttribute(
        "aria-label",
        showingPassword ? "Ocultar senha" : "Mostrar senha",
      );
    });
  });
}

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAuthError(form);
    setFormLoading(form, true);

    const email = form.querySelector('input[name="email"]')?.value?.trim();
    const senha = form.querySelector('input[name="senha"]')?.value;

    if (!email || !senha) {
      showAuthError(form, "Preencha e-mail e senha.");
      setFormLoading(form, false);
      return;
    }

    try {
      await api.login({ identifier: email, password: senha });
      window.location.href = "/pages/inicio/pagina-inicial.html";
    } catch (error) {
      const msg =
        error?.message || "Não foi possível fazer login. Tente novamente.";
      showAuthError(form, msg);
      setFormLoading(form, false);
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAuthError(form);
    setFormLoading(form, true);

    const nome = form.querySelector('input[name="nome"]')?.value?.trim();
    const username = form.querySelector('input[name="username"]')?.value?.trim();
    const email = form.querySelector('input[name="email"]')?.value?.trim();
    const senha = form.querySelector('input[name="senha"]')?.value;
    const confirmacao = form.querySelector('input[name="confirmacao"]')?.value;

    if (!nome || !username || !email || !senha || !confirmacao) {
      showAuthError(form, "Preencha todos os campos obrigatórios.");
      setFormLoading(form, false);
      return;
    }

    if (senha !== confirmacao) {
      showAuthError(form, "As senhas não coincidem.");
      setFormLoading(form, false);
      return;
    }

    if (senha.length < 12) {
      showAuthError(form, "A senha deve ter pelo menos 12 caracteres.");
      setFormLoading(form, false);
      return;
    }

    try {
      await api.register({
        displayName: nome,
        username,
        email,
        password: senha,
        accountType: "PLAYER",
      });
      window.location.href = "/pages/inicio/pagina-inicial.html";
    } catch (error) {
      const msg =
        error?.message || "Não foi possível criar a conta. Tente novamente.";
      showAuthError(form, msg);
      setFormLoading(form, false);
    }
  });
}

function initProfileForm() {
  const formPanel = document.querySelector(".form-panel");
  if (!formPanel) return;

  // monta o select com as modalidades da api e ja deixa marcado o que o usuario curte
  const sportSelect = formPanel.querySelector('select[name="esporte"]');
  if (sportSelect) {
    api.reference.sports().then((sports) => {
      if (!Array.isArray(sports)) return;
      const currentUser = getCurrentUser();
      const favIds = new Set(
        (currentUser?.favoriteSports || []).map((s) => s.id),
      );
      const options = sports.map((sport) => {
        const opt = document.createElement("option");
        opt.value = sport.id;
        opt.textContent = sport.name;
        if (favIds.has(sport.id)) opt.selected = true;
        return opt;
      });
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Selecione";
      sportSelect.replaceChildren(placeholder, ...options);
    }).catch(() => {});
  }

  // puxa os dados mais recentes do perfil pra garantir que nenhum input fique vazio
  api.me().then((freshUser) => {
    if (!freshUser) return;
    const nameInput = formPanel.querySelector('input[name="nome"]');
    const usernameInput = formPanel.querySelector('input[name="username"]');
    const emailInput = formPanel.querySelector('input[name="email"]');
    const phoneInput = formPanel.querySelector('input[name="telefone"]');
    if (nameInput && !nameInput.value) nameInput.value = freshUser.displayName || "";
    if (usernameInput && !usernameInput.value) usernameInput.value = freshUser.username || "";
    if (emailInput && !emailInput.value) emailInput.value = freshUser.email || "";
    if (phoneInput && !phoneInput.value) phoneInput.value = freshUser.phone || "";
  }).catch(() => {});

  formPanel.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentUser = getCurrentUser();

    const nameVal =
      formPanel.querySelector('input[name="nome"]')?.value?.trim() ||
      currentUser?.displayName;
    const usernameVal =
      formPanel.querySelector('input[name="username"]')?.value?.trim() ||
      currentUser?.username;
    const emailVal =
      formPanel.querySelector('input[name="email"]')?.value?.trim() ||
      currentUser?.email;
    const phoneVal =
      formPanel.querySelector('input[name="telefone"]')?.value?.trim() ||
      currentUser?.phone;

    if (!nameVal || !usernameVal || !emailVal) {
      announce("Preencha nome completo, nome de usuário e e-mail.");
      return;
    }

    // pega os ids das opcoes selecionadas pra mandar no patch do usuario
    const selectedSportIds = sportSelect
      ? [...sportSelect.selectedOptions]
          .map((opt) => Number(opt.value))
          .filter((id) => id > 0)
      : undefined;

    try {
      await api.updateProfile({
        displayName: nameVal,
        username: usernameVal,
        email: emailVal,
        phone: phoneVal || null,
        favoriteSportIds: selectedSportIds && selectedSportIds.length > 0
          ? selectedSportIds
          : null,
      });
      announce("Dados pessoais atualizados com sucesso.");
      renderUserData();
    } catch (err) {
      announce(err?.message || "Não foi possível atualizar os dados.");
    }
  });
}

function initLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      await api.logout();
      window.location.href =
        "/pages/autenticacao/entrar/entrar-na-conta.html";
    });
  });
}

export function initializeUserAuthHandlers() {
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();
  initProfileForm();
  initLogoutButtons();
}
