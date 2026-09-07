import { announce } from "./dom.js";

function initializeFeedbackButtons() {
  for (const button of document.querySelectorAll("[data-feedback]")) {
    button.addEventListener("click", () => announce(button.dataset.feedback));
  }
}

function initializeRemovableCards() {
  for (const button of document.querySelectorAll("[data-remove-card]")) {
    button.addEventListener("click", () => {
      const card = button.closest("article");
      const title = card?.querySelector("h2, h3")?.textContent || "Item";
      card?.remove();
      announce(`${title} foi removido.`);
    });
  }
}

// alterna visualizacao e obrigatoriedade dos campos entre cartao e pix
function initializePaymentOptions() {
  const cardFields = document.querySelector("[data-card-fields]");
  const pixPanel = document.querySelector("[data-pix-panel]");
  const methods = document.querySelectorAll("input[name='pagamento']");
  if (!cardFields || !pixPanel || !methods.length) return;

  const update = () => {
    const method = document.querySelector(
      "input[name='pagamento']:checked",
    )?.value;
    const showCard = method === "card";
    cardFields.hidden = !showCard;
    pixPanel.hidden = showCard;
    for (const input of cardFields.querySelectorAll("input"))
      input.required = showCard;
  };

  methods.forEach((input) => input.addEventListener("change", update));
  update();
}

function initializeDemoForms() {
  for (const form of document.querySelectorAll("[data-demo-form]")) {
    form.addEventListener("submit", (event) => {
      if (form.action && !form.dataset.stay) return;
      event.preventDefault();
      announce(form.dataset.success || "Informações salvas com sucesso.");
    });
  }
}

export function initializeInteractions() {
  initializeFeedbackButtons();
  initializeRemovableCards();
  initializePaymentOptions();
  initializeDemoForms();

  for (const node of document.querySelectorAll("[data-current-year]")) {
    node.textContent = new Date().getFullYear();
  }
}
