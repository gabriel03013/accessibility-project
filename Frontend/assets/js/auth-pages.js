import { ApiError, api, getSession, refreshSession } from "./api.js?v=20260727-9";
import {
  clearFieldErrors,
  getQueryParameter,
  navigate,
  safeInternalPath,
  setFormBusy,
  showFieldErrors,
  showFormMessage
} from "./dom.js?v=20260727-9";

function formMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Não foi possível falar com o servidor. Tente novamente em instantes.";
}

function destination(fallback = "../perfil/") {
  return safeInternalPath(getQueryParameter("next"), fallback);
}

async function redirectAuthenticated() {
  if (getSession()) {
    navigate(destination());
    return true;
  }

  try {
    await refreshSession();
    navigate(destination());
    return true;
  } catch {
    return false;
  }
}

export async function initializeLoginPage() {
  if (await redirectAuthenticated()) {
    return;
  }

  const form = document.querySelector("[data-login-form]");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    showFormMessage(form, "", "success");
    setFormBusy(form, true);

    try {
      await api.login({
        identifier: form.elements.identifier.value.trim(),
        password: form.elements.password.value
      });
      navigate(destination());
    } catch (error) {
      if (error instanceof ApiError) {
        showFieldErrors(form, error.errors);
      }
      showFormMessage(form, formMessage(error));
    } finally {
      setFormBusy(form, false);
    }
  });
}

export async function initializeRegisterPage() {
  if (await redirectAuthenticated()) {
    return;
  }

  const form = document.querySelector("[data-register-form]");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    showFormMessage(form, "", "success");
    setFormBusy(form, true);

    try {
      await api.register({
        displayName: form.elements.displayName.value.trim(),
        username: form.elements.username.value.trim(),
        email: form.elements.email.value.trim(),
        password: form.elements.password.value,
        accountType: form.elements.accountType.value
      });
      navigate(destination());
    } catch (error) {
      if (error instanceof ApiError) {
        showFieldErrors(form, error.errors);
      }
      showFormMessage(form, formMessage(error));
    } finally {
      setFormBusy(form, false);
    }
  });
}
