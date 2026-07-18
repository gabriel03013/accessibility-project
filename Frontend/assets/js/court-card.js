import { ApiError, api } from "./api.js?v=20260727-9";
import {
  createElement,
  installImageFallback,
  loginPath,
  navigate,
  notify,
  safeUrl
} from "./dom.js?v=20260727-9";
import { formatCurrency } from "./format.js?v=20260727-9";

const fallbackImage = "/assets/images/court-placeholder.svg";

function favoriteButton(court, saved, onRemoved) {
  const button = createElement("button", {
    className: "icon-button bg-white",
    attributes: {
      type: "button",
      "aria-label": saved
        ? `Remover ${court.name} das quadras salvas`
        : `Salvar ${court.name}`
    }
  }, createElement("i", {
    className: saved ? "fa-solid fa-heart text-brand" : "fa-regular fa-heart",
    attributes: { "aria-hidden": "true" }
  }));

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      if (saved) {
        await api.courts.unsave(court.id);
        onRemoved?.(court.id);
        notify("Quadra removida das salvas.");
      } else {
        await api.courts.save(court.id);
        button.replaceChildren(createElement("i", {
          className: "fa-solid fa-heart text-brand",
          attributes: { "aria-hidden": "true" }
        }));
        button.setAttribute("aria-label", `Remover ${court.name} das quadras salvas`);
        saved = true;
        notify("Quadra salva para consultar depois.");
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate(loginPath());
        return;
      }
      notify(error instanceof ApiError ? error.message : "Não foi possível atualizar suas quadras salvas.", "error");
    } finally {
      button.disabled = false;
    }
  });
  return button;
}

export function createCourtCard(court, options = {}) {
  const detailPath = `../quadra/?slug=${encodeURIComponent(court.slug)}`;
  const photoUrl = safeUrl(court.coverPhoto?.url, fallbackImage);
  const image = installImageFallback(createElement("img", {
    attributes: {
      src: photoUrl,
      alt: court.coverPhoto?.altText || `Vista da quadra ${court.name}`,
      loading: "lazy",
      decoding: "async"
    }
  }), fallbackImage);
  const imageLink = createElement("a", {
    attributes: {
      href: detailPath,
      "aria-label": `Ver detalhes de ${court.name}`
    }
  }, image);
  const media = createElement("div", { className: "court-media" }, [
    imageLink,
    createElement("div", { className: "absolute top-3 right-3" },
      favoriteButton(court, Boolean(options.saved), options.onRemoved))
  ]);

  const title = createElement(options.headingTag || "h2", { className: "font-bold" },
    createElement("a", {
      className: "link",
      attributes: { href: detailPath },
      text: court.name
    }));
  const location = [court.neighborhood, court.city, court.state].filter(Boolean).join(" · ");
  const rating = Number(court.averageRating);
  const metadata = createElement("div", { className: "court-meta mt-4" }, [
    createElement("span", {}, [
      createElement("i", {
        className: "fa-solid fa-star text-yellow-500",
        attributes: { "aria-hidden": "true" }
      }),
      ` ${Number.isFinite(rating) ? rating.toFixed(1).replace(".", ",") : "Novo"}`
    ]),
    createElement("span", {
      className: "muted",
      text: court.reviewCount === 1 ? "1 avaliação" : `${court.reviewCount || 0} avaliações`
    })
  ]);
  const sports = Array.isArray(court.sports) && court.sports.length
    ? createElement("p", { className: "help mt-3", text: court.sports.join(" · ") })
    : null;
  const body = createElement("div", { className: "court-card-body" }, [
    createElement("div", { className: "flex justify-between gap-3" }, [
      createElement("div", {}, [
        title,
        createElement("p", { className: "muted text-xs mt-1", text: location })
      ]),
      createElement("span", {
        className: "court-price",
        text: `${formatCurrency(court.startingPrice)}/h`
      })
    ]),
    metadata,
    sports
  ].filter(Boolean));

  return createElement("article", { className: "card card-hover court-card" }, [media, body]);
}
