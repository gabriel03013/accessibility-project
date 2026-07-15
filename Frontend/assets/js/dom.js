const allowedProtocols = new Set(["http:", "https:"]);
const blockedAttributes = new Set(["srcdoc", "style"]);

function isSafeAttribute(name) {
  const normalized = String(name).toLowerCase();
  return !normalized.startsWith("on") && !blockedAttributes.has(normalized);
}

export function createElement(tagName, options = {}, children = []) {
  const node = document.createElement(tagName);

  if (options.className) {
    node.className = options.className;
  }

  if (options.text !== undefined) {
    node.textContent = String(options.text);
  }

  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) {
      if (isSafeAttribute(name) && value !== undefined && value !== null && value !== false) {
        node.setAttribute(name, value === true ? "" : String(value));
      }
    }
  }

  if (options.dataset) {
    for (const [name, value] of Object.entries(options.dataset)) {
      if (value !== undefined && value !== null) {
        node.dataset[name] = String(value);
      }
    }
  }

  for (const child of Array.isArray(children) ? children : [children]) {
    if (child instanceof Node) {
      node.append(child);
    } else if (child !== undefined && child !== null) {
      node.append(document.createTextNode(String(child)));
    }
  }

  return node;
}

export function replaceChildren(node, children = []) {
  node.replaceChildren();
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child instanceof Node) {
      node.append(child);
    }
  }
}

export function setText(node, value, fallback = "") {
  if (node) {
    node.textContent = value === undefined || value === null ? fallback : String(value);
  }
}

export function safeUrl(value, fallback = "") {
  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(String(value), window.location.origin);
    return allowedProtocols.has(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export function installImageFallback(
  image,
  fallbackUrl = "/assets/images/court-placeholder.svg"
) {
  if (!(image instanceof HTMLImageElement)) {
    return image;
  }
  const fallback = safeUrl(fallbackUrl);
  image.addEventListener("error", () => {
    if (fallback && image.src !== fallback) {
      image.src = fallback;
    }
  }, { once: true });
  return image;
}

export function safeInternalPath(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(String(value), window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/pages/")) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function createStatusRegion(form) {
  const existing = form.querySelector("[data-form-status]");
  if (existing) {
    return existing;
  }

  const region = createElement("div", {
    className: "form-status",
    attributes: {
      role: "status",
      "aria-live": "polite",
      "data-form-status": ""
    }
  });
  form.prepend(region);
  return region;
}

export function showFormMessage(form, message, type = "error") {
  const region = createStatusRegion(form);
  region.className = `form-status form-status-${type}`;
  region.textContent = message;
  region.hidden = !message;
}

export function clearFieldErrors(form) {
  for (const input of form.querySelectorAll("[aria-invalid='true']")) {
    input.removeAttribute("aria-invalid");
  }
}

export function showFieldErrors(form, errors = []) {
  clearFieldErrors(form);
  for (const error of errors) {
    const input = form.elements.namedItem(error.field);
    if (input instanceof HTMLElement) {
      input.setAttribute("aria-invalid", "true");
    }
  }
}

export function setFormBusy(form, busy) {
  form.setAttribute("aria-busy", String(busy));
  for (const control of form.elements) {
    if (control instanceof HTMLButtonElement) {
      control.disabled = busy;
    }
  }
}

export function createEmptyState(title, description) {
  return createElement("div", { className: "empty-state" }, [
    createElement("span", {
      className: "empty-icon",
      attributes: { "aria-hidden": "true" }
    }, createElement("i", { className: "fa-regular fa-calendar-xmark" })),
    createElement("h2", { className: "title-md mt-4", text: title }),
    createElement("p", { className: "muted text-sm mt-2", text: description })
  ]);
}

export function createLoadingState(label = "Carregando…") {
  return createElement("div", {
    className: "loading-state",
    attributes: {
      role: "status",
      "aria-live": "polite"
    }
  }, [
    createElement("span", {
      className: "loading-spinner",
      attributes: { "aria-hidden": "true" }
    }),
    createElement("span", { text: label })
  ]);
}

export function getQueryParameter(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function navigate(path) {
  window.location.assign(path);
}

export function loginPath() {
  const next = `${window.location.pathname}${window.location.search}`;
  return `/pages/login/?next=${encodeURIComponent(next)}`;
}

export function notify(message, type = "success") {
  let region = document.querySelector("[data-toast-region]");
  if (!region) {
    region = createElement("div", {
      className: "toast-region",
      attributes: {
        "aria-live": "polite",
        "aria-atomic": "true",
        "data-toast-region": ""
      }
    });
    document.body.append(region);
  }

  const toast = createElement("div", {
    className: `toast toast-${type}`,
    attributes: { role: type === "error" ? "alert" : "status" },
    text: message
  });
  region.append(toast);
  window.setTimeout(() => toast.remove(), 4500);
}
