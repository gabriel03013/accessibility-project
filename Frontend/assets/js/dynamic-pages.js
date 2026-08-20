import { api } from "./api.js";
import { isAuthenticated } from "./user-session.js";
import { announce, element } from "./dom.js";

export function initializeDynamicPages() {
  const path = window.location.pathname;

  if (path.includes("pagina-inicial.html")) {
    loadHomeHighlights();
  } else if (path.includes("explorar-quadras-e-partidas.html")) {
    loadExploreCourts();
  } else if (path.includes("meus-espacos.html")) {
    loadOwnerCourts();
    loadOwnerRequests();
  } else if (path.includes("cadastrar-quadra.html")) {
    initCourtCreationForm();
  } else if (path.includes("minhas-reservas.html")) {
    loadUserReservations();
  } else if (path.includes("painel-da-conta.html")) {
    loadAccountDashboard();
  } else if (path.includes("meus-favoritos.html")) {
    loadFavorites();
  } else if (path.includes("minhas-avaliacoes.html")) {
    initReviewsPage();
  } else if (path.includes("detalhes-da-quadra.html")) {
    loadCourtDetails();
  } else if (path.includes("carrinho-de-reservas.html")) {
    loadCart();
  } else if (path.includes("pagamento-da-reserva.html")) {
    initPaymentPage();
  } else if (path.includes("reserva-confirmada.html")) {
    loadBookingConfirmation();
  } else if (path.includes("times-e-ranking.html")) {
    loadTeamsAndRanking();
  }
}

let filterDebounceTimeout = null;

function courtHref(slug) {
  return `/pages/detalhes/detalhes-da-quadra.html?slug=${encodeURIComponent(slug)}`;
}

function coverUrl(court) {
  return court.coverPhoto?.url || court.photos?.find((photo) => photo.cover)?.url
    || court.photos?.[0]?.url || "/assets/images/hero-court-real.jpg";
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "Consulte";
  const amount = Number(value);
  if (Number.isNaN(amount)) return `R$ ${value}`;
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// formata data e hora no fuso de sp e calcula a duracao em horas quebradas
function formatBookingDate(startsAt, endsAt) {
  const starts = new Date(startsAt);
  const ends = new Date(endsAt);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) return "Horário a confirmar";

  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(starts);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(starts);
  const hours = Math.round((ends.getTime() - starts.getTime()) / 3600000 * 100) / 100;
  const duration = `${hours.toLocaleString("pt-BR")} ${hours === 1 ? "hora" : "horas"}`;
  return `${date}, ${time} · ${duration}`;
}

// pega o dia de hoje no formato yyyy-mm-dd em sp pro min do input date
function todayForDateInput() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function courtCard(court) {
  const sportsText = (court.sports || []).join(", ") || "Poliesportiva";
  const priceText = formatPrice(court.startingPrice);
  const ratingText = court.averageRating ? `★ ${court.averageRating}` : "Novo";

  return element("article", { className: "card card-interactive" }, [
    element("img", {
      className: "card-media",
      attributes: { src: coverUrl(court), alt: court.name },
    }),
    element("div", { className: "card-body" }, [
      element("div", { className: "court-meta" }, [
        element("span", { className: "badge", text: sportsText }),
        element("span", { text: ratingText }),
      ]),
      element("h3", { className: "mt-3", text: court.name }),
      element("p", { text: `${court.neighborhood || court.city || "São Paulo"}` }),
      element("p", {}, [
        element("strong", { text: priceText }),
        document.createTextNode(" por hora"),
      ]),
      element("a", {
        className: "btn btn-primary btn-block",
        attributes: { href: courtHref(court.slug) },
        text: "Ver horários",
      }),
    ]),
  ]);
}

async function loadHomeHighlights() {
  const grid = document.querySelector(".court-grid");
  if (!grid) return;

  try {
    const page = await api.courts.search({ size: 3, order: "RATING" });
    const courts = page?.content || [];
    if (!courts.length) return;
    grid.replaceChildren(...courts.map(courtCard));
  } catch {
    // mantem os destaques estaticos se a api falhar
  }
}

async function loadExploreCourts() {
  const container = document.getElementById("partidas-abertas");
  if (!container) return;

  const filterForm = document.getElementById("filter-form");
  const sortSelect = document.getElementById("sort-order");
  const resultsCountEl = document.getElementById("results-count");

  const urlParams = new URLSearchParams(window.location.search);
  const initialSport = urlParams.get("sport") || urlParams.get("esporte") || "";
  const initialLocation = urlParams.get("location") || urlParams.get("bairro") || "";
  const initialQ = urlParams.get("q") || "";

  if (filterForm) {
    if (initialQ) {
      const qInput = filterForm.querySelector('input[name="q"]');
      if (qInput) qInput.value = initialQ;
    }
    if (initialLocation) {
      const locInput = filterForm.querySelector('input[name="location"]');
      if (locInput) locInput.value = initialLocation;
    }
    if (initialSport) {
      const sportRadio = filterForm.querySelector(
        `input[name="sport"][value="${initialSport.toLowerCase()}"]`,
      );
      if (sportRadio) sportRadio.checked = true;
    }
  }

  const fetchAndRender = async () => {
    const q = filterForm?.querySelector('input[name="q"]')?.value?.trim() || "";
    const location = filterForm?.querySelector('input[name="location"]')?.value?.trim() || "";
    const sportChecked = filterForm?.querySelector('input[name="sport"]:checked')?.value || "";
    const order = sortSelect?.value || "RECENT";

    const params = { size: 12, order };
    if (q) params.q = q;
    if (location) params.location = location;
    if (sportChecked) params.sport = sportChecked;

    try {
      const page = await api.courts.search(params);
      const courts = page?.content || [];

      if (resultsCountEl) {
        const total = page?.totalElements ?? courts.length;
        resultsCountEl.textContent = `${total} ${total === 1 ? "quadra encontrada" : "quadras encontradas"}`;
      }

      const cardsContainer = container.querySelector(".results-grid") || container;
      const header = cardsContainer.querySelector(".results-header");

      if (!courts.length) {
        const emptyState = element("div", { className: "panel text-center py-10 w-full col-span-full" }, [
          element("p", { className: "lead mb-2", text: "Nenhuma quadra encontrada com os filtros selecionados." }),
          element("p", { className: "muted", text: "Tente buscar por outro bairro, esporte ou termo." }),
        ]);
        if (header) {
          cardsContainer.replaceChildren(header, emptyState);
        } else {
          cardsContainer.replaceChildren(emptyState);
        }
        return;
      }

      const courtCards = courts.map(courtCard);
      if (header) {
        cardsContainer.replaceChildren(header, ...courtCards);
      } else {
        cardsContainer.replaceChildren(...courtCards);
      }
    } catch {
      if (resultsCountEl) resultsCountEl.textContent = "Erro ao carregar quadras";
    }
  };

  if (filterForm) {
    // debounce de 300ms pra nao ficar chamando a api a cada letra digitada
    filterForm.querySelectorAll('input[type="search"]').forEach((input) => {
      input.addEventListener("input", () => {
        clearTimeout(filterDebounceTimeout);
        filterDebounceTimeout = setTimeout(fetchAndRender, 300);
      });
    });

    filterForm.querySelectorAll('input[name="sport"]').forEach((radio) => {
      radio.addEventListener("change", fetchAndRender);
    });

    filterForm.addEventListener("reset", () => {
      setTimeout(fetchAndRender, 50);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", fetchAndRender);
  }

  fetchAndRender();
}

async function loadOwnerCourts() {
  if (!isAuthenticated()) return;

  const container = document.querySelector('section[aria-labelledby="espacos"]');
  if (!container) return;

  try {
    const page = await api.courts.mine(0, 20);
    const courts = page?.content || [];

    const heading = container.querySelector(".section-heading");
    if (!courts.length) {
      const emptyState = element("div", { className: "panel text-center py-8" }, [
        element("p", { className: "lead mb-4", text: "Você ainda não possui quadras cadastradas." }),
        element("a", {
          className: "btn btn-accent",
          attributes: { href: "cadastrar-quadra.html" },
          text: "Cadastrar minha primeira quadra",
        }),
      ]);
      container.replaceChildren(heading, emptyState);
      return;
    }

    const cards = courts.map((court) => {
      return element("article", { className: "card reservation-card" }, [
        element("img", { attributes: { src: coverUrl(court), alt: court.name } }),
        element("div", {}, [
          element("h3", { className: "mb-1", text: court.name }),
          element("p", { className: "mb-1", text: `${court.neighborhood}, ${court.city}` }),
        ]),
        element("div", { className: "hero-actions" }, [
          element("a", {
            className: "btn btn-secondary",
            attributes: { href: courtHref(court.slug) },
            text: "Ver anúncio",
          }),
        ]),
      ]);
    });

    container.replaceChildren(heading, ...cards);
  } catch {
    // mantem dados atuais caso nao seja proprietario ou de erro
  }
}

async function loadOwnerRequests() {
  if (!isAuthenticated()) return;

  const section = document.querySelector('section[aria-labelledby="solicitacoes"]');
  if (!section) return;
  const heading = section.querySelector("h2");
  try {
    const page = await api.bookings.owner(0, 20);
    const requests = (page?.content || []).filter((item) => item.status === "PENDING");
    if (!requests.length) {
      section.replaceChildren(heading, element("p", {
        className: "muted",
        text: "Não há solicitações aguardando aprovação.",
      }));
      return;
    }
    const cards = requests.map((request) => {
      const card = element("article", { className: "card reservation-card" }, [
        element("div", {}, [
          element("span", { className: "badge", text: "Aguardando aprovação" }),
          element("h3", { className: "mt-2 mb-1", text: request.courtName }),
          element("p", { text: `${formatBookingDate(request.startsAt, request.endsAt)} · ${formatPrice(request.amount)}` }),
          element("p", { className: "muted mb-0", text: `Solicitado por ${request.requesterName || "jogador"}` }),
        ]),
        element("div", { className: "hero-actions" }, [
          element("button", { className: "btn btn-accent", attributes: { type: "button" }, text: "Aprovar" }),
          element("button", { className: "btn btn-secondary", attributes: { type: "button" }, text: "Recusar" }),
        ]),
      ]);
      const [acceptButton, rejectButton] = card.querySelectorAll("button");
      const setLoading = (loading) => {
        acceptButton.disabled = loading;
        rejectButton.disabled = loading;
      };
      acceptButton.addEventListener("click", async () => {
        setLoading(true);
        try {
          await api.bookings.accept(request.id);
          announce("Solicitação aprovada. A reserva aguarda o pagamento do jogador.");
          loadOwnerRequests();
        } catch (error) {
          announce(error.message || "Não foi possível aprovar a solicitação.");
          setLoading(false);
        }
      });
      rejectButton.addEventListener("click", async () => {
        setLoading(true);
        try {
          await api.bookings.reject(request.id);
          announce("Solicitação recusada.");
          loadOwnerRequests();
        } catch (error) {
          announce(error.message || "Não foi possível recusar a solicitação.");
          setLoading(false);
        }
      });
      return card;
    });
    section.replaceChildren(heading, ...cards);
  } catch (error) {
    section.replaceChildren(heading, element("p", {
      className: "muted",
      text: error.message || "Não foi possível carregar as solicitações.",
    }));
  }
}

function initCourtCreationForm() {
  const form = document.querySelector("form.content-stack");
  if (!form) return;

  const sportSelect = form.querySelector('select[name="modalidade"]');
  let amenitiesBySlug = new Map();

  api.reference.sports().then((sports) => {
    if (!sportSelect || !Array.isArray(sports)) return;
    const options = [
      element("option", { attributes: { value: "" }, text: "Selecione" }),
      ...sports.map((sport) =>
        element("option", {
          attributes: { value: String(sport.id) },
          text: sport.name,
        }),
      ),
    ];
    sportSelect.replaceChildren(...options);
  }).catch(() => {});

  api.reference.amenities().then((amenities) => {
    if (!Array.isArray(amenities)) return;
    amenitiesBySlug = new Map(amenities.map((item) => [item.slug, item.id]));
  }).catch(() => {});

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isAuthenticated()) {
      announce("Você precisa estar logado para cadastrar uma quadra.");
      window.location.href = "/pages/autenticacao/entrar/entrar-na-conta.html";
      return;
    }

    const name = form.querySelector('input[name="nome"]')?.value?.trim();
    const description = form.querySelector('textarea[name="descricao"]')?.value?.trim();
    const observation = form.querySelector('textarea[name="observacoes"]')?.value?.trim();
    const price = form.querySelector('input[name="valor"]')?.value;
    const sportId = Number(form.querySelector('select[name="modalidade"]')?.value);
    const addressLine = form.querySelector('input[name="rua"]')?.value?.trim();
    const addressNumber = form.querySelector('input[name="numero"]')?.value?.trim();
    const addressComplement = form.querySelector('input[name="complemento"]')?.value?.trim();
    const postalCode = form.querySelector('input[name="cep"]')?.value?.trim();
    const neighborhood = form.querySelector('input[name="bairro"]')?.value?.trim();
    const city = form.querySelector('input[name="cidade"]')?.value?.trim();
    const state = form.querySelector('input[name="estado"]')?.value?.trim()?.toUpperCase();

    if (!name || !description || !addressLine || !addressNumber || !neighborhood || !city || !state || !postalCode) {
      announce("Preencha todos os campos obrigatórios do endereço e da quadra.");
      return;
    }

    if (!sportId) {
      announce("Selecione a modalidade principal da quadra.");
      return;
    }

    const amenityIds = [...form.querySelectorAll('input[name="amenity"]:checked')]
      .map((input) => amenitiesBySlug.get(input.value))
      .filter(Boolean);

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      // sobe as fotos em sequencia pra api de midia e se falhar usa imagem padrao
      const files = [...(form.querySelector('input[name="fotos"]')?.files || [])];
      const photos = [];
      for (const [index, file] of files.entries()) {
        try {
          const uploaded = await api.media.uploadImage(file);
          photos.push({
            storageKey: uploaded.storageKey,
            publicUrl: uploaded.publicUrl,
            altText: name,
            cover: index === 0,
          });
        } catch {
          // continua tentando as outras fotos se uma falhar
        }
      }

      if (!photos.length) {
        photos.push({
          storageKey: "court-default",
          publicUrl: "/assets/images/court-futsal-real.jpg",
          altText: name,
          cover: true,
        });
      }

      await api.courts.create({
        name,
        description,
        observation: observation || undefined,
        addressLine,
        addressNumber,
        addressComplement: addressComplement || undefined,
        neighborhood,
        city,
        state,
        postalCode,
        timezone: "America/Sao_Paulo",
        amenityIds,
        sports: [
          {
            sportId,
            pricePerHour: Number(price) || 80.0,
            minDurationMinutes: 60,
            maxParticipants: 14,
          },
        ],
        photos,
      });

      announce("Quadra cadastrada com sucesso!");
      window.location.href = "meus-espacos.html";
    } catch (err) {
      announce(err.message || "Não foi possível cadastrar a quadra. Verifique se sua conta é de proprietário.");
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

export function formatReservationStatus(status) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Aguardando pagamento";
    case "CONFIRMED":
      return "Confirmada";
    case "IN_PROGRESS":
      return "Em andamento";
    case "COMPLETED":
      return "Concluída";
    case "CANCELLED":
      return "Cancelada";
    case "NO_SHOW":
      return "Não compareceu";
    case "PENDING":
      return "Pendente de aprovação";
    case "COUNTER_PROPOSED":
      return "Contraproposta enviada";
    case "ACCEPTED":
      return "Aprovada";
    case "REJECTED":
      return "Recusada";
    case "EXPIRED":
      return "Expirada";
    default:
      return status || "Pendente";
  }
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
    case "ACCEPTED":
      return "badge-success";
    case "AWAITING_PAYMENT":
    case "PENDING":
    case "COUNTER_PROPOSED":
      return "badge-warning";
    case "CANCELLED":
    case "REJECTED":
    case "NO_SHOW":
    case "EXPIRED":
      return "badge-danger";
    case "IN_PROGRESS":
      return "badge-info";
    default:
      return "badge-secondary";
  }
}

function reservationCard(item, customBadgeClass = null) {
  const dateStr = item.startsAt
    ? new Date(item.startsAt).toLocaleString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const statusLabel = formatReservationStatus(item.status);
  const badgeClass = customBadgeClass || getStatusBadgeClass(item.status);

  const content = [
    element("img", {
      attributes: { src: "/assets/images/court-volleyball-real.jpg", alt: item.courtName },
    }),
    element("div", {}, [
      element("span", { className: `badge ${badgeClass}`, text: statusLabel }),
      element("h3", { className: "mt-2 mb-1", text: item.courtName }),
      element("p", { className: "mb-0", text: `${dateStr} · ${formatPrice(item.amount)}` }),
    ]),
  ];
  if (item.status === "AWAITING_PAYMENT" && item.id) {
    content.push(element("a", {
      className: "btn btn-accent",
      attributes: { href: `/pages/checkout/pagamento/pagamento-da-reserva.html?reservationId=${encodeURIComponent(item.id)}` },
      text: "Realizar pagamento",
    }));
  }
  return element("article", { className: "card reservation-card" }, content);
}

async function loadUserReservations() {
  if (!isAuthenticated()) return;

  const upcoming = document.querySelector('section[aria-labelledby="proximas"]');
  const previous = document.querySelector('section[aria-labelledby="anteriores"]');
  if (!upcoming) return;

  try {
    const [reservationsPage, requestsPage] = await Promise.all([
      api.bookings.reservations(0, 20),
      api.bookings.mine(0, 20),
    ]);
    const reservations = reservationsPage?.content || [];
    const requests = requestsPage?.content || [];
    // separa reservas futuras de passadas e pendencias comparando com agora
    const now = Date.now();
    const upcomingReservations = reservations.filter((item) => new Date(item.startsAt).getTime() >= now);
    const pastReservations = reservations.filter((item) => new Date(item.startsAt).getTime() < now);
    const pendingRequests = requests.filter(
      (item) => item.status === "PENDING" || item.status === "COUNTER_PROPOSED",
    );

    const heading = upcoming.querySelector("h2");
    const stack = upcoming.querySelector(".content-stack") || upcoming;
    const cards = [
      ...upcomingReservations.map((item) => reservationCard(item)),
      ...pendingRequests.map((item) => reservationCard(item, "")),
    ];

    if (!cards.length) {
      const emptyState = element("div", { className: "panel text-center py-8 my-4" }, [
        element("p", { className: "lead mb-4", text: "Você ainda não possui reservas agendadas." }),
        element("a", {
          className: "btn btn-accent",
          attributes: { href: "/pages/explorar/explorar-quadras-e-partidas.html" },
          text: "Explorar quadras disponíveis",
        }),
      ]);
      if (heading) upcoming.replaceChildren(heading, emptyState);
      else stack.replaceChildren(emptyState);
    } else {
      stack.replaceChildren(...cards);
    }

    if (previous) {
      const pastHeading = previous.querySelector("h2");
      if (!pastReservations.length) return;
      previous.replaceChildren(
        pastHeading,
        ...pastReservations.map((item) => reservationCard(item)),
      );
    }
  } catch {
    // mantem dados se der erro
  }
}

async function loadAccountDashboard() {
  if (!isAuthenticated()) return;
  const section = document.querySelector('section[aria-labelledby="proxima"]');
  if (!section) return;

  try {
    const page = await api.bookings.reservations(0, 1);
    const next = page?.content?.[0];
    const heading = section.querySelector(".section-heading");
    if (!next) return;
    section.replaceChildren(heading, reservationCard(next));
  } catch {
    // mantem estado vazio
  }
}

async function loadFavorites() {
  if (!isAuthenticated()) return;
  const stack = document.querySelector(".account-content .content-stack");
  if (!stack) return;

  try {
    const page = await api.courts.saved(0, 20);
    const courts = page?.content || [];
    if (!courts.length) return;
    stack.replaceChildren(...courts.map(courtCard));
  } catch {
    // mantem estado vazio
  }
}

function initReviewsPage() {
  const pendingSection = document.querySelector('section[aria-labelledby="pendente"]');
  const historySection = document.querySelector('section[aria-labelledby="historico"]');
  const reviewForm = pendingSection?.querySelector("form");

  if (reviewForm) {
    reviewForm.removeAttribute("data-demo-form");
    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const rating = reviewForm.querySelector('input[name="nota"]:checked')?.value;
      const comment = reviewForm.querySelector('textarea[name="comentario"]')?.value?.trim();

      if (!rating) {
        announce("Por favor, selecione uma nota de 1 a 5 estrelas.");
        return;
      }

      if (!comment) {
        announce("Por favor, escreva um breve comentário sobre sua experiência.");
        return;
      }

      if (historySection) {
        const historyContainer = historySection.querySelector("article")?.parentElement || historySection;
        const newReviewCard = element("article", { className: "card review-card" }, [
          element("img", {
            attributes: { src: "/assets/images/hero-court-real.jpg", alt: "Quadra avaliada" },
          }),
          element("div", {}, [
            element("span", { className: "badge", text: `${rating} de 5 estrelas` }),
            element("h3", { className: "mt-2 mb-1", text: "Ginásio Aurora" }),
            element("blockquote", { className: "mb-0", text: `“${comment}”` }),
          ]),
        ]);
        historyContainer.prepend(newReviewCard);
      }

      const successPanel = element("div", { className: "panel text-center py-6 my-4" }, [
        element("p", { className: "lead text-success mb-2", text: "✓ Avaliação enviada com sucesso!" }),
        element("p", { className: "muted mb-0", text: "Obrigado por ajudar a comunidade com sua opinião." }),
      ]);
      pendingSection.replaceChildren(pendingSection.querySelector("h2"), successPanel);
      announce("Sua avaliação foi registrada!");
    });
  }
}

async function loadCart() {
  const itemSection = document.querySelector('section[aria-labelledby="itens"]');
  const summaryPanel = document.querySelector(".summary-panel");
  if (!itemSection || !summaryPanel) return;

  const heading = itemSection.querySelector("h2");
  const summaryHeading = summaryPanel.querySelector("h2");
  let items;
  try {
    items = await api.cart.items();
  } catch (error) {
    itemSection.replaceChildren(heading, element("p", {
      className: "muted",
      text: error.message || "Não foi possível carregar o carrinho.",
    }));
    return;
  }

  if (!items.length) {
    itemSection.replaceChildren(heading, element("div", { className: "panel text-center py-8" }, [
      element("p", { className: "lead mb-4", text: "Seu carrinho está vazio." }),
      element("a", {
        className: "btn btn-accent",
        attributes: { href: "../../explorar/explorar-quadras-e-partidas.html" },
        text: "Explorar quadras disponíveis",
      }),
    ]));
    summaryPanel.replaceChildren(
      summaryHeading,
      element("p", { className: "muted mb-0", text: "Adicione uma reserva para ver o resumo." }),
    );
    return;
  }

  // soma o total acumulado de todos os itens do carrinho
  const amount = items.reduce((total, item) => total + Number(item.amount || 0), 0);
  const amountText = formatPrice(amount);
  const cards = items.map((item) => {
    const card = element("article", { className: "card checkout-card" }, [
      element("img", {
        attributes: {
          src: item.imageUrl || "/assets/images/court-placeholder.svg",
          alt: `Foto da quadra ${item.courtName}`,
        },
      }),
      element("div", {}, [
        element("span", { className: "badge", text: item.sport || "Quadra esportiva" }),
        element("h3", { className: "mt-2 mb-1", text: item.courtName }),
        element("p", { className: "mb-1", text: formatBookingDate(item.startsAt, item.endsAt) }),
        element("strong", { text: formatPrice(item.amount) }),
      ]),
      element("button", { className: "btn btn-danger", attributes: { type: "button" }, text: "Remover" }),
    ]);
    card.querySelector("button").addEventListener("click", async () => {
      try {
        await api.cart.remove(item.id);
        announce(`${item.courtName} foi removida do carrinho.`);
        loadCart();
      } catch (error) {
        announce(error.message || "Não foi possível remover o item do carrinho.");
      }
    });
    return card;
  });

  itemSection.replaceChildren(
    heading,
    ...cards,
    element("a", {
      className: "link inline-block mt-5",
      attributes: { href: "../../explorar/explorar-quadras-e-partidas.html" },
      text: "← Continuar explorando",
    }),
  );
  summaryPanel.replaceChildren(
    summaryHeading,
    element("div", { className: "summary-row" }, [
      element("span", { text: "Subtotal" }),
      element("strong", { text: amountText }),
    ]),
    element("div", { className: "summary-row summary-total" }, [
      element("span", { text: "Total" }),
      element("span", { text: amountText }),
    ]),
    element("button", {
      className: "btn btn-accent btn-block mt-5",
      attributes: { type: "button" },
      text: "Continuar",
    }),
    element("p", { className: "help-text text-center mt-3", text: "Pagamento seguro e simulado." }),
  );
  const continueButton = summaryPanel.querySelector("button");
  continueButton.addEventListener("click", async () => {
    continueButton.disabled = true;
    try {
      await api.cart.checkout();
      announce("Solicitação enviada. Aguarde a aprovação do proprietário para realizar o pagamento.");
      window.location.href = "/pages/conta/reservas/minhas-reservas.html";
    } catch (error) {
      announce(error.message || "Não foi possível enviar a solicitação de reserva.");
      continueButton.disabled = false;
    }
  });
}

async function initPaymentPage() {
  const reservationId = new URLSearchParams(window.location.search).get("reservationId");
  const form = document.getElementById("payment-form");
  const summary = document.querySelector(".summary-panel");
  if (!reservationId || !form || !summary) {
    window.location.href = "/pages/conta/reservas/minhas-reservas.html";
    return;
  }

  let reservation;
  try {
    reservation = await api.bookings.reservation(reservationId);
  } catch (error) {
    announce(error.message || "Não foi possível carregar a reserva.");
    return;
  }
  // so deixa pagar se a reserva ja foi aprovada pelo dono
  if (reservation.status !== "AWAITING_PAYMENT") {
    announce("Esta reserva não está disponível para pagamento.");
    window.location.href = "/pages/conta/reservas/minhas-reservas.html";
    return;
  }

  summary.replaceChildren(
    element("h2", { className: "text-xl", text: "Resumo da reserva" }),
    element("p", {}, [
      element("strong", { text: reservation.courtName }),
      document.createElement("br"),
      document.createTextNode(formatBookingDate(reservation.startsAt, reservation.endsAt)),
    ]),
    element("div", { className: "summary-row summary-total" }, [
      element("span", { text: "Total" }),
      element("span", { text: formatPrice(reservation.amount) }),
    ]),
    element("p", {
      className: "help-text mt-4",
      text: "Ambiente de demonstração: nenhum dado bancário real será processado.",
    }),
  );
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
      await api.payments.pay(reservationId);
      window.location.href = `../confirmacao/reserva-confirmada.html?reservationId=${encodeURIComponent(reservationId)}`;
    } catch (error) {
      announce(error.message || "Não foi possível confirmar o pagamento.");
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function loadBookingConfirmation() {
  const reservationId = new URLSearchParams(window.location.search).get("reservationId");
  const section = document.querySelector(".success-hero");
  if (!reservationId || !section) return;
  try {
    const reservation = await api.bookings.reservation(reservationId);
    if (reservation.status !== "CONFIRMED") return;
    const lead = section.querySelector(".lead");
    if (lead) lead.textContent = `${reservation.courtName} · ${formatBookingDate(reservation.startsAt, reservation.endsAt)}.`;
    const summary = section.querySelector(".panel");
    if (summary) {
      summary.replaceChildren(
        element("div", { className: "summary-row" }, [
          element("span", { text: "Código" }),
          element("strong", { text: reservation.confirmationCode }),
        ]),
        element("div", { className: "summary-row summary-total" }, [
          element("span", { text: "Total" }),
          element("span", { text: formatPrice(reservation.amount) }),
        ]),
      );
    }
  } catch {
    // mantem a confirmacao estatica como fallback
  }
}

async function loadCourtDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");
  if (!slug) return;

  try {
    const detail = await api.courts.get(slug);
    if (!detail) return;

    const titleEl = document.getElementById("titulo");
    if (titleEl) titleEl.textContent = detail.name;

    const breadcrumbCurrent = document.querySelector('.breadcrumbs li[aria-current="page"]');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = detail.name;

    const aboutSection = document.querySelector('section[aria-labelledby="sobre"] p.lead');
    if (aboutSection && detail.description) aboutSection.textContent = detail.description;

    const locationLine = document.querySelector(".detail-content > p");
    if (locationLine && detail.address) {
      const rating = detail.averageRating ? `★ ${detail.averageRating}` : "Nova";
      const reviews = detail.reviewCount ? ` em ${detail.reviewCount} avaliações` : "";
      locationLine.textContent = `${rating}${reviews} · ${detail.address.neighborhood}, ${detail.address.city}`;
    }

    const gallery = document.querySelector(".gallery");
    if (gallery && detail.photos?.length) {
      gallery.replaceChildren(
        ...detail.photos.map((photo) =>
          element("img", {
            attributes: { src: photo.url, alt: photo.altText || detail.name },
          }),
        ),
      );
    }

    const selectedSport = detail.sports?.[0];
    const pricePerHour = Number(selectedSport?.pricePerHour);
    const priceEl = document.querySelector(".booking-panel .eyebrow");
    if (priceEl && Number.isFinite(pricePerHour)) {
      priceEl.textContent = `A partir de ${formatPrice(pricePerHour)}/h`;
    }

    const amenitiesList = document.querySelector(".amenity-list");
    if (amenitiesList && detail.amenities?.length) {
      const items = detail.amenities.map((item) => element("li", { text: `✓ ${item.name}` }));
      amenitiesList.replaceChildren(...items);
    }

    const saveBtn = document.getElementById("save-court");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        if (!isAuthenticated()) {
          window.location.href = "/pages/autenticacao/entrar/entrar-na-conta.html";
          return;
        }
        try {
          await api.courts.save(detail.id);
          announce(`${detail.name} foi adicionada aos favoritos.`);
        } catch (error) {
          announce(error.message || "Não foi possível salvar esta quadra.");
        }
      });
    }

    const bookingForm = document.getElementById("booking-form");
    const dateInput = bookingForm?.querySelector('input[name="data"]');
    if (dateInput) {
      dateInput.min = todayForDateInput();
    }

    const durationSelect = bookingForm?.querySelector('select[name="duracao"]');
    const totalEl = bookingForm?.querySelector("[data-booking-total]");
    // recalcula o preco total quando o usuario troca a quantidade de horas
    const updateBookingTotal = () => {
      if (!totalEl || !Number.isFinite(pricePerHour)) return;
      const hours = Number(durationSelect?.value || 1);
      totalEl.textContent = formatPrice(pricePerHour * hours);
    };
    durationSelect?.addEventListener("change", updateBookingTotal);
    updateBookingTotal();

    bookingForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isAuthenticated()) {
        window.location.href = "/pages/autenticacao/entrar/entrar-na-conta.html";
        return;
      }

      const date = bookingForm.querySelector('input[name="data"]')?.value;
      const time = bookingForm.querySelector('input[name="horario"]:checked')?.value;
      const hours = Number(bookingForm.querySelector('select[name="duracao"]')?.value || 1);
      const sportId = selectedSport?.id;

      if (!date || !time || !sportId) {
        announce("Escolha data, horário e uma modalidade para reservar.");
        return;
      }

      // monta os timestamps de inicio e fim somando a duracao em horas e valida horario futuro
      const starts = new Date(`${date}T${time}:00`);
      const ends = new Date(starts.getTime() + hours * 60 * 60 * 1000);
      if (starts.getTime() <= Date.now()) {
        announce("Escolha um horário futuro para a reserva.");
        return;
      }

      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      try {
        await api.cart.add({
          courtId: detail.id,
          sportId,
          startsAt: starts.toISOString(),
          endsAt: ends.toISOString(),
          participants: 1,
        });
        window.location.href = "/pages/checkout/carrinho/carrinho-de-reservas.html";
      } catch (error) {
        announce(error.message || "Não foi possível enviar a solicitação de reserva.");
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  } catch {
    // mantem conteudo padrao se der erro
  }
}

async function loadTeamsAndRanking() {
  const listEl = document.querySelector(".ranking-list");
  if (!listEl) return;

  try {
    const page = await api.teams.search({ size: 10 });
    const teams = page?.content || [];
    if (!teams.length) {
      listEl.replaceChildren(element("li", { className: "muted", text: "Nenhum time público encontrado." }));
      return;
    }

    const items = teams.map((team, idx) => {
      const sportsText = (team.sports || []).join(", ") || "Poliesportiva";
      return element("li", {}, [
        element("strong", { text: `${idx + 1}º ${team.name}` }),
        element("span", { text: `${sportsText} · ${team.members?.length || 1} membros` }),
      ]);
    });

    listEl.replaceChildren(...items);
  } catch {
    listEl.replaceChildren(element("li", { className: "muted", text: "Não foi possível carregar os times." }));
  }
}

