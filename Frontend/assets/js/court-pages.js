import { ApiError, api } from "./api.js?v=20260727-9";
import { createCourtCard } from "./court-card.js?v=20260727-9";
import {
  createElement,
  createEmptyState,
  createLoadingState,
  getQueryParameter,
  installImageFallback,
  loginPath,
  navigate,
  notify,
  replaceChildren,
  safeUrl,
  setFormBusy,
  showFormMessage
} from "./dom.js?v=20260727-9";
import { formatCurrency, slugify } from "./format.js?v=20260727-9";

const fallbackImage = "/assets/images/court-placeholder.svg";

function courtImage(options) {
  return installImageFallback(createElement("img", options), fallbackImage);
}

async function loadSports(select, selectedSlug = "") {
  const sports = await api.reference.sports();
  if (select instanceof HTMLSelectElement) {
    replaceChildren(select, [
      createElement("option", { attributes: { value: "" }, text: "Todos os esportes" }),
      ...sports.map((sport) => createElement("option", {
        attributes: { value: sport.slug },
        text: sport.name
      }))
    ]);
    select.value = selectedSlug;
  }
  return sports;
}

function renderHomeSports(container, sports) {
  replaceChildren(container, sports.map((sport) => createElement("a", {
    className: "sport-chip",
    attributes: {
      href: `../buscar/?sport=${encodeURIComponent(sport.slug)}`
    }
  }, [
    createElement("i", {
      className: "fa-solid fa-medal text-brand",
      attributes: { "aria-hidden": "true" }
    }),
    sport.name
  ])));
}

function renderPagination(container, page) {
  const navigation = container.closest("section")?.querySelector("nav[aria-label='Paginação']");
  if (!navigation) {
    return;
  }
  navigation.replaceChildren();
  if (page.totalPages <= 1) {
    navigation.hidden = true;
    return;
  }
  navigation.hidden = false;
  for (let index = 0; index < page.totalPages; index += 1) {
    const parameters = new URLSearchParams(window.location.search);
    parameters.set("page", String(index));
    navigation.append(createElement("a", {
      className: index === page.number ? "icon-button bg-brand text-white" : "icon-button",
      attributes: {
        href: `?${parameters.toString()}`,
        "aria-current": index === page.number ? "page" : null,
        "aria-label": `Página ${index + 1}`
      },
      text: index + 1
    }));
  }
}

function errorState(error, fallback) {
  return createEmptyState(
    "Não foi possível carregar",
    error instanceof ApiError ? error.message : fallback
  );
}

export async function initializeHomePage() {
  const form = document.querySelector(".search-bar");
  const sportSelect = form?.querySelector("select[name='sport']");
  const sportList = document.querySelector("[data-sport-list]");
  const sportStatus = document.querySelector("#sport-status");
  try {
    const sports = await loadSports(sportSelect);
    if (sportList) {
      renderHomeSports(sportList, sports);
      sportList.setAttribute("aria-busy", "false");
    }
    if (sportStatus) {
      sportStatus.textContent = `${sports.length} esportes disponíveis.`;
    }
  } catch (error) {
    if (sportSelect instanceof HTMLSelectElement) {
      replaceChildren(sportSelect, createElement("option", {
        attributes: { value: "" },
        text: "Esportes indisponíveis"
      }));
    }
    if (sportList) {
      replaceChildren(sportList, errorState(error, "Tente novamente em instantes."));
      sportList.setAttribute("aria-busy", "false");
    }
    if (sportStatus) {
      sportStatus.textContent = "Não foi possível carregar os esportes.";
    }
  }

  const grid = document.querySelector(".court-grid");
  if (!grid) {
    return;
  }
  replaceChildren(grid, createLoadingState("Buscando quadras perto de você…"));
  grid.setAttribute("aria-busy", "true");
  try {
    const page = await api.courts.search({ size: 3 });
    replaceChildren(
      grid,
      page.content.length
        ? page.content.map((court) => createCourtCard(court, { headingTag: "h3" }))
        : createEmptyState("Nenhuma quadra publicada", "Novos espaços aparecerão aqui em breve.")
    );
  } catch (error) {
    replaceChildren(grid, errorState(error, "Tente novamente em instantes."));
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}

export async function initializeSearchPage() {
  const grid = document.querySelector(".result-grid");
  const searchForm = document.querySelector("main > form.search-bar");
  if (!grid || !(searchForm instanceof HTMLFormElement)) {
    return;
  }
  grid.hidden = false;
  replaceChildren(grid, createLoadingState("Procurando quadras…"));

  const location = getQueryParameter("location") || "";
  const sport = getQueryParameter("sport") || "";
  const query = getQueryParameter("query") || "";
  const order = getQueryParameter("order") || "RECENT";
  const pageNumber = Number.parseInt(getQueryParameter("page") || "0", 10) || 0;
  searchForm.elements.location.value = location;
  searchForm.elements.query.value = query;
  await loadSports(searchForm.elements.sport, sport).catch(() => undefined);
  const orderSelect = document.querySelector("#order");
  if (orderSelect instanceof HTMLSelectElement) {
    orderSelect.value = ["RECENT", "RATING", "NAME"].includes(order) ? order : "RECENT";
    orderSelect.addEventListener("change", () => {
      const parameters = new URLSearchParams(window.location.search);
      parameters.set("order", orderSelect.value);
      parameters.delete("page");
      navigate(`?${parameters.toString()}`);
    });
  }

  const activeFilters = document.querySelector("[data-active-filters]");
  const filters = [
    ["location", location],
    ["sport", sportSelectLabel(searchForm.elements.sport, sport)],
    ["query", query]
  ].filter(([, value]) => value);
  if (activeFilters) {
    replaceChildren(activeFilters, filters.map(([name, label]) => {
      const parameters = new URLSearchParams(window.location.search);
      parameters.delete(name);
      parameters.delete("page");
      return createElement("a", {
        className: "badge badge-brand",
        attributes: {
          href: parameters.toString() ? `?${parameters.toString()}` : "./",
          "aria-label": `Remover filtro ${label}`
        },
        text: `${label} ×`
      });
    }));
  }
  try {
    const page = await api.courts.search({
      location,
      sport,
      q: query,
      order,
      page: pageNumber,
      size: 12
    });
    replaceChildren(
      grid,
      page.content.length
        ? page.content.map((court) => createCourtCard(court))
        : createEmptyState("Nenhuma quadra encontrada", "Tente retirar um filtro ou buscar outra cidade.")
    );
    const heading = document.querySelector("main h1");
    if (heading) {
      heading.textContent = location ? `Quadras em ${location}` : "Quadras disponíveis";
    }
    const counter = heading?.nextElementSibling;
    if (counter) {
      counter.textContent = page.totalElements === 1
        ? "1 resultado"
        : `${page.totalElements} resultados`;
    }
    renderPagination(grid, page);
  } catch (error) {
    replaceChildren(grid, errorState(error, "Não foi possível buscar quadras."));
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}

function sportSelectLabel(select, value) {
  if (!(select instanceof HTMLSelectElement) || !value) {
    return "";
  }
  return select.selectedOptions[0]?.textContent?.trim() || value;
}

function detailGallery(court) {
  const photos = Array.isArray(court.photos) && court.photos.length ? court.photos.slice(0, 4) : [];
  if (!photos.length) {
    photos.push({
      url: fallbackImage,
      altText: `Vista da quadra ${court.name}`
    });
  }
  while (photos.length < 4) {
    photos.push(photos[photos.length - 1]);
  }
  return createElement("div", { className: "gallery" }, photos.map((photo, index) =>
    courtImage({
      className: index === 0 ? "gallery-main" : "",
      attributes: {
        src: safeUrl(photo.url, fallbackImage),
        alt: photo.altText || `Foto ${index + 1} de ${court.name}`,
        decoding: "async"
      }
    })));
}

function mapPreview(address, courtName) {
  const mapAddress = [
    [address.addressLine, address.addressNumber].filter(Boolean).join(", "),
    address.neighborhood,
    address.city,
    address.state,
    address.postalCode,
    "Brasil"
  ].filter(Boolean).join(", ");
  const encodedAddress = encodeURIComponent(mapAddress);
  const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  return createElement("section", { className: "divider pt-7 mt-7" }, [
    createElement("div", { className: "section-head" }, [
      createElement("div", {}, [
        createElement("h2", { className: "title-md", text: "Localização" }),
        createElement("p", { className: "muted text-sm mt-2", text: mapAddress })
      ]),
      createElement("a", {
        className: "btn btn-secondary",
        attributes: {
          href: externalUrl,
          target: "_blank",
          rel: "noopener noreferrer"
        },
        text: "Abrir no Google Maps"
      })
    ]),
    createElement("iframe", {
      className: "map-preview mt-5",
      attributes: {
        src: mapUrl,
        title: `Mapa da localização de ${courtName}`,
        loading: "lazy",
        referrerpolicy: "no-referrer-when-downgrade"
      }
    })
  ]);
}

function detailContent(court) {
  const address = court.address || {};
  const addressText = [
    [address.addressLine, address.addressNumber].filter(Boolean).join(", "),
    address.neighborhood,
    address.city,
    address.state
  ].filter(Boolean).join(" · ");
  const badges = createElement("div", { className: "flex flex-wrap gap-2 mb-3" },
    court.sports.map((sport) => createElement("span", {
      className: "badge badge-brand",
      text: sport.name
    })));
  const details = createElement("article", {}, [
    badges,
    createElement("h1", { className: "title-lg", text: court.name }),
    createElement("p", { className: "muted mt-2", text: addressText }),
    createElement("div", { className: "flex flex-wrap gap-5 mt-6 text-sm" }, [
      createElement("span", {
        text: `${Number(court.averageRating || 0).toFixed(1).replace(".", ",")} · ${court.reviewCount || 0} avaliações`
      }),
      createElement("span", { text: `Espaço de ${court.ownerName}` })
    ]),
    createElement("section", { className: "divider pt-7 mt-7" }, [
      createElement("h2", { className: "title-md", text: "Sobre a quadra" }),
      createElement("p", { className: "lead mt-3", text: court.description })
    ]),
    Array.isArray(court.amenities) && court.amenities.length
      ? createElement("section", { className: "divider pt-7 mt-7" }, [
          createElement("h2", { className: "title-md", text: "Estrutura" }),
          createElement("ul", {
            className: "grid sm:grid-cols-2 gap-3 mt-4",
            attributes: { "aria-label": "Itens disponíveis" }
          }, court.amenities.map((amenity) => createElement("li", {
            className: "choice text-sm",
            text: amenity.name
          })))
        ])
      : null,
    court.observation
      ? createElement("section", { className: "divider pt-7 mt-7" }, [
          createElement("h2", { className: "title-md", text: "Antes do jogo" }),
          createElement("p", { className: "lead mt-3", text: court.observation })
        ])
      : null,
    mapPreview(address, court.name)
  ].filter(Boolean));

  const sportSelect = createElement("select", {
    className: "field",
    attributes: { id: "booking-sport", name: "sport" }
  }, court.sports.map((sport) => createElement("option", {
    attributes: { value: sport.id },
    text: `${sport.name} · ${formatCurrency(sport.pricePerHour)}/h`
  })));
  const bookingForm = createElement("form", { className: "panel sidebar space-y-4" }, [
    createElement("h2", { className: "title-md", text: "Escolha como quer jogar" }),
    createElement("div", { className: "field-group" }, [
      createElement("label", {
        className: "label",
        attributes: { for: "booking-sport" },
        text: "Esporte"
      }),
      sportSelect
    ]),
    createElement("button", {
      className: "btn btn-primary btn-block",
      attributes: { type: "submit" },
      text: "Solicitar uma reserva"
    }),
    createElement("p", {
      className: "help",
      text: "O proprietário confirma o pedido antes do pagamento."
    })
  ]);
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    navigate(`../solicitar-reserva/?court=${encodeURIComponent(court.id)}&slug=${encodeURIComponent(court.slug)}&sport=${encodeURIComponent(sportSelect.value)}`);
  });

  return createElement("div", { className: "split mt-9" }, [details, bookingForm]);
}

export async function initializeCourtPage() {
  const main = document.querySelector("main");
  const slug = getQueryParameter("slug");
  if (!main) {
    return;
  }
  main.hidden = false;
  replaceChildren(main, createLoadingState("Carregando detalhes da quadra…"));
  if (!slug) {
    replaceChildren(main, createEmptyState("Quadra não informada", "Volte à busca e escolha uma quadra."));
    return;
  }
  try {
    const court = await api.courts.get(slug);
    document.title = `${court.name} — Partiu Quadra`;
    replaceChildren(main, [
      detailGallery(court),
      detailContent(court)
    ]);
    main.className = "page";
  } catch (error) {
    replaceChildren(main, errorState(error, "Esta quadra pode não estar mais publicada."));
  } finally {
    main.setAttribute("aria-busy", "false");
  }
}

export async function initializeSavedCourtsPage() {
  const grid = document.querySelector("section.court-grid");
  if (!grid) {
    return;
  }
  grid.hidden = false;
  replaceChildren(grid, createLoadingState("Carregando quadras salvas…"));
  try {
    const page = await api.courts.saved();
    const remove = (courtId) => {
      const card = grid.querySelector(`[data-court-id="${CSS.escape(courtId)}"]`);
      card?.remove();
      if (!grid.children.length) {
        replaceChildren(grid, createEmptyState("Nada salvo ainda", "Use o coração nas quadras que quiser comparar."));
      }
    };
    const cards = page.content.map((court) => {
      const card = createCourtCard(court, { saved: true, onRemoved: remove });
      card.dataset.courtId = court.id;
      return card;
    });
    replaceChildren(
      grid,
      cards.length
        ? cards
        : createEmptyState("Nada salvo ainda", "Use o coração nas quadras que quiser comparar.")
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      navigate(loginPath());
      return;
    }
    replaceChildren(grid, errorState(error, "Não foi possível carregar suas quadras."));
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}

function ownerCourtCard(court) {
  const detailPath = court.status === "PUBLISHED"
    ? `../quadra/?slug=${encodeURIComponent(court.slug)}`
    : null;
  const photo = safeUrl(court.coverPhoto?.url, fallbackImage);
  const actions = createElement("div", { className: "grid gap-2" });
  if (detailPath) {
    actions.append(createElement("a", {
      className: "btn btn-secondary",
      attributes: { href: detailPath },
      text: "Ver anúncio"
    }));
  }
  return createElement("article", { className: "panel" }, [
    createElement("div", { className: "grid md:grid-cols-5 gap-5 items-center" }, [
      courtImage({
        className: "rounded-lg w-full h-32 object-cover",
        attributes: {
          src: photo,
          alt: court.coverPhoto?.altText || `Foto de ${court.name}`,
          loading: "lazy"
        }
      }),
      createElement("div", { className: "md:col-span-3" }, [
        createElement("span", {
          className: court.status === "PUBLISHED" ? "badge badge-success" : "badge badge-warning",
          text: court.status === "PUBLISHED" ? "Publicado" : "Em análise"
        }),
        createElement("h2", { className: "title-md mt-3", text: court.name }),
        createElement("p", {
          className: "muted text-xs mt-1",
          text: `${court.neighborhood} · ${formatCurrency(court.startingPrice)}/h`
        }),
        createElement("p", {
          className: "help mt-3",
          text: Array.isArray(court.sports) ? court.sports.join(" · ") : ""
        })
      ]),
      actions
    ])
  ]);
}

export async function initializeOwnerCourtsPage() {
  const list = document.querySelector("main section.grid");
  if (!list) {
    return;
  }
  list.hidden = false;
  replaceChildren(list, createLoadingState("Carregando suas quadras…"));
  try {
    const page = await api.courts.mine();
    replaceChildren(
      list,
      page.content.length
        ? page.content.map(ownerCourtCard)
        : createEmptyState("Cadastre sua primeira quadra", "Leva poucos minutos para enviar as informações para análise.")
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      navigate(loginPath());
      return;
    }
    replaceChildren(list, errorState(error, "Não foi possível carregar seus anúncios."));
  } finally {
    list.setAttribute("aria-busy", "false");
  }
}

function splitAddress(value) {
  const match = String(value || "").trim().match(/^(.*?)[,\s]+(\d+[A-Za-z-]*)$/);
  return match ? { line: match[1].trim(), number: match[2] } : { line: String(value || "").trim(), number: "S/N" };
}

function appendPhotoEditor(container, upload, index, courtName) {
  const altInput = createElement("input", {
    className: "field",
    attributes: {
      type: "text",
      maxlength: "180",
      required: true,
      value: `${courtName || "Quadra"} — foto ${index + 1}`,
      "aria-label": `Descrição da foto ${index + 1}`
    }
  });
  const item = createElement("div", { className: "photo-editor" }, [
    courtImage({
      attributes: {
        src: safeUrl(upload.publicUrl),
        alt: "",
        "aria-hidden": "true"
      }
    }),
    createElement("div", { className: "field-group" }, [
      createElement("label", {
        className: "label",
        text: index === 0 ? "Descrição da foto de capa" : `Descrição da foto ${index + 1}`
      }),
      altInput
    ])
  ]);
  container.append(item);
  return altInput;
}

export async function initializeCreateCourtPage() {
  const form = document.querySelector("main form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const sportSelect = form.querySelector("#sport");
  let sports = [];
  let amenities = [];
  try {
    [sports, amenities] = await Promise.all([
      loadSports(sportSelect),
      api.reference.amenities()
    ]);
  } catch {
    showFormMessage(form, "Não foi possível carregar as opções do cadastro.");
  }

  const amenityGrid = form.querySelector("[data-amenity-options]");
  if (amenityGrid) {
    replaceChildren(amenityGrid, amenities.map((amenity) =>
      createElement("label", { className: "choice" }, [
        createElement("input", {
          attributes: {
            type: "checkbox",
            name: "amenityIds",
            value: amenity.id
          }
        }),
        createElement("span", { className: "text-sm", text: amenity.name })
      ])));
  }

  const fileInput = form.querySelector("#photos");
  const photoFieldset = fileInput?.closest("fieldset");
  const photoList = createElement("div", {
    className: "photo-editor-list mt-5",
    attributes: { "aria-live": "polite" }
  });
  photoFieldset?.append(photoList);
  let uploadedPhotos = [];
  let uploadInProgress = false;

  fileInput?.addEventListener("change", async () => {
    const files = Array.from(fileInput.files || []).slice(0, 10);
    uploadedPhotos = [];
    photoList.replaceChildren();
    if (!files.length) {
      return;
    }
    uploadInProgress = true;
    setFormBusy(form, true);
    showFormMessage(form, `Enviando ${files.length} foto${files.length === 1 ? "" : "s"}…`, "success");
    try {
      for (const [index, file] of files.entries()) {
        const upload = await api.media.uploadImage(file);
        const altInput = appendPhotoEditor(
          photoList,
          upload,
          index,
          form.elements.name.value.trim()
        );
        uploadedPhotos.push({ ...upload, altInput });
      }
      showFormMessage(form, "Fotos prontas para o cadastro.", "success");
    } catch (error) {
      uploadedPhotos = [];
      photoList.replaceChildren();
      showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível enviar as fotos.");
    } finally {
      uploadInProgress = false;
      setFormBusy(form, false);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (uploadInProgress) {
      showFormMessage(form, "Aguarde o envio das fotos terminar.");
      return;
    }
    if (!uploadedPhotos.length) {
      showFormMessage(form, "Selecione ao menos uma foto da quadra.");
      fileInput?.focus();
      return;
    }
    const selectedSport = sports.find((sport) => String(sport.id) === form.elements.sportId.value);
    if (!selectedSport) {
      showFormMessage(form, "Escolha um esporte disponível.");
      return;
    }
    const address = splitAddress(form.elements.address.value);
    setFormBusy(form, true);
    showFormMessage(form, "", "success");
    try {
      await api.courts.create({
        name: form.elements.name.value.trim(),
        description: form.elements.description.value.trim(),
        observation: form.elements.observation.value.trim() || null,
        addressLine: address.line,
        addressNumber: form.elements.addressNumber.value.trim() || address.number,
        addressComplement: form.elements.addressComplement.value.trim() || null,
        neighborhood: form.elements.neighborhood.value.trim(),
        city: form.elements.city.value.trim(),
        state: form.elements.state.value.trim().toUpperCase(),
        postalCode: form.elements.postalCode.value.trim(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
        amenityIds: Array.from(form.querySelectorAll("input[name='amenityIds']:checked"))
          .map((input) => Number(input.value)),
        sports: [{
          sportId: selectedSport.id,
          pricePerHour: Number(form.elements.pricePerHour.value),
          minDurationMinutes: 60,
          maxParticipants: 40
        }],
        photos: uploadedPhotos.map((photo, index) => ({
          storageKey: photo.storageKey,
          publicUrl: photo.publicUrl,
          altText: photo.altInput.value.trim(),
          cover: index === 0
        }))
      });
      notify("Quadra enviada para análise.");
      navigate("../meus-anuncios/");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate(loginPath());
        return;
      }
      showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível cadastrar a quadra.");
    } finally {
      setFormBusy(form, false);
    }
  });
}
