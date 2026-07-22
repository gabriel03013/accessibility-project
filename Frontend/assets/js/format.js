const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const messageDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo"
});

const messageTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Sao_Paulo"
});

export function formatCurrency(value, currency = "BRL") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "Preço sob consulta";
  }
  if (currency === "BRL") {
    return currencyFormatter.format(amount);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(amount);
}

export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : dateFormatter.format(date);
}

export function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Horário indisponível" : dateTimeFormatter.format(date);
}

export function formatMessageDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Horário indisponível";
  }
  return `${messageDateFormatter.format(date)}, ${messageTimeFormatter.format(date)}`;
}

export function initials(value) {
  const names = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return names.map((name) => name.charAt(0).toUpperCase()).join("") || "PQ";
}

export function toIsoDateTime(dateValue, timeValue) {
  const date = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function addMinutes(isoValue, minutes) {
  const date = new Date(isoValue);
  date.setMinutes(date.getMinutes() + Number(minutes));
  return date.toISOString();
}

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
