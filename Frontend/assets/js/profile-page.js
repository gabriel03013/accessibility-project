import { ApiError, api } from "./api.js?v=20260727-9";
import {
  createElement,
  loginPath,
  navigate,
  replaceChildren,
  setFormBusy,
  showFormMessage
} from "./dom.js?v=20260727-9";
import { initials } from "./format.js?v=20260727-9";

function fillProfileCard(card, user) {
  if (!card) {
    return;
  }
  const avatar = card.querySelector(".avatar");
  const heading = card.querySelector("h1");
  const username = card.querySelector("p");
  if (avatar) {
    avatar.textContent = initials(user.displayName);
  }
  if (heading) {
    heading.textContent = user.displayName;
  }
  if (username) {
    username.textContent = `@${user.username}`;
  }
}

function sportChoices(sports, selectedIds) {
  return sports.map((sport) => createElement("label", { className: "choice" }, [
    createElement("input", {
      attributes: {
        type: "checkbox",
        name: "favoriteSportIds",
        value: sport.id,
        checked: selectedIds.has(sport.id)
      }
    }),
    createElement("span", { className: "text-sm", text: sport.name })
  ]));
}

export async function initializeProfilePage() {
  const main = document.querySelector("main");
  const form = main?.querySelector("form");
  if (!main || !(form instanceof HTMLFormElement)) {
    return;
  }
  try {
    const [user, sports] = await Promise.all([
      api.me(),
      api.reference.sports()
    ]);
    fillProfileCard(main.querySelector("aside .panel"), user);
    const nameInput = form.querySelector("#name");
    const usernameInput = form.querySelector("#username");
    const emailInput = form.querySelector("#email");
    const phoneInput = form.querySelector("#phone");
    nameInput.name = "displayName";
    usernameInput.name = "username";
    emailInput.name = "email";
    phoneInput.name = "phone";
    nameInput.value = user.displayName;
    usernameInput.value = user.username;
    emailInput.value = user.email;
    phoneInput.value = user.phone || "";

    const preferenceSection = form.querySelector("#preferences")?.closest("section");
    const preferenceContainer = preferenceSection?.querySelector(".flex.flex-wrap");
    if (preferenceContainer) {
      const selectedIds = new Set((user.favoriteSports || []).map((sport) => sport.id));
      replaceChildren(preferenceContainer, sportChoices(sports, selectedIds));
      preferenceContainer.className = "grid sm:grid-cols-2 gap-3 mt-4";
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFormBusy(form, true);
      showFormMessage(form, "", "success");
      try {
        const updated = await api.updateProfile({
          displayName: nameInput.value.trim(),
          username: usernameInput.value.trim(),
          email: emailInput.value.trim(),
          phone: phoneInput.value.trim() || null,
          favoriteSportIds: Array.from(form.querySelectorAll("input[name='favoriteSportIds']:checked"))
            .map((input) => Number(input.value))
        });
        fillProfileCard(main.querySelector("aside .panel"), updated);
        showFormMessage(form, "Alterações salvas.", "success");
      } catch (error) {
        showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível salvar suas alterações.");
      } finally {
        setFormBusy(form, false);
      }
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      navigate(loginPath());
      return;
    }
    showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível carregar seu perfil.");
  }
}
