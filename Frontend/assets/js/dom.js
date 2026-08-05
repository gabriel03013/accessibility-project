export function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);

  if (options.className) node.className = options.className;
  if (options.text) node.textContent = options.text;

  for (const [name, value] of Object.entries(options.attributes || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (value === true) node.setAttribute(name, "");
    else node.setAttribute(name, value);
  }

  const childList = Array.isArray(children) ? children : [children];
  node.append(...childList.filter(Boolean));
  return node;
}

export function icon(label) {
  return element("span", {
    attributes: { "aria-hidden": "true" },
    text: label,
  });
}

export function announce(message) {
  let region = document.querySelector("[data-toast-region]");

  if (!region) {
    region = element("div", {
      className: "toast-region",
      attributes: {
        "data-toast-region": "",
        "aria-live": "polite",
        "aria-atomic": "true",
      },
    });
    document.body.append(region);
  }

  const toast = element("div", { className: "toast", text: message });
  region.append(toast);
  window.setTimeout(() => toast.remove(), 4000);
}
