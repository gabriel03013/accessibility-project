import { ApiError, api } from "./api.js?v=20260727-9";
import {
  createElement,
  createEmptyState,
  createLoadingState,
  getQueryParameter,
  loginPath,
  navigate,
  notify,
  replaceChildren,
  setFormBusy,
  showFormMessage
} from "./dom.js?v=20260727-9";
import { addMinutes, formatCurrency, formatDateTime, initials, toIsoDateTime } from "./format.js?v=20260727-9";

const requestLabels = {
  PENDING: ["Aguardando resposta", "badge-warning"],
  COUNTER_PROPOSED: ["Contraproposta enviada", "badge-accent"],
  ACCEPTED: ["Aceita", "badge-success"],
  REJECTED: ["Recusada", "badge-danger"],
  CANCELLED: ["Cancelada", "badge-neutral"],
  EXPIRED: ["Expirada", "badge-neutral"]
};

function protectedError(error, container) {
  if (error instanceof ApiError && error.status === 401) {
    navigate(loginPath());
    return;
  }
  replaceChildren(container, createEmptyState(
    "Não foi possível carregar",
    error instanceof ApiError ? error.message : "Tente novamente em instantes."
  ));
}

function requestCard(request) {
  const [label, badgeClass] = requestLabels[request.status] || [request.status, "badge-neutral"];
  return createElement("article", { className: "panel" }, [
    createElement("div", { className: "grid md:grid-cols-4 gap-5 items-center" }, [
      createElement("div", { className: "md:col-span-2 flex gap-4" }, [
        createElement("span", { className: "avatar", text: initials(request.requesterName) }),
        createElement("div", {}, [
          createElement("span", { className: `badge ${badgeClass}`, text: label }),
          createElement("h2", { className: "font-bold mt-2", text: request.requesterName }),
          createElement("p", {
            className: "help",
            text: `${request.courtName} · ${formatDateTime(request.startsAt)}`
          })
        ])
      ]),
      createElement("p", {
        className: "text-sm font-bold",
        text: formatCurrency(request.amount, request.currency)
      }),
      createElement("div", { className: "flex gap-2 md:justify-end" }, [
        createElement("a", {
          className: "btn btn-primary",
          attributes: { href: `../solicitacao/?request=${encodeURIComponent(request.id)}` },
          text: "Revisar"
        }),
        createElement("a", {
          className: "btn btn-secondary",
          attributes: { href: `../chat/?request=${encodeURIComponent(request.id)}&mode=owner` },
          text: "Mensagem"
        })
      ])
    ])
  ]);
}

export async function initializeOwnerRequestsPage() {
  const main = document.querySelector("main");
  if (!main) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando solicitações…"));
  try {
    const page = await api.bookings.owner();
    replaceChildren(main, [
      createElement("div", { className: "section-head" }, [
        createElement("div", {}, [
          createElement("p", { className: "eyebrow", text: "Área do proprietário" }),
          createElement("h1", { className: "title-lg mt-2", text: "Solicitações" }),
          createElement("p", {
            className: "lead mt-2",
            text: "Responda cada pedido antes do prazo terminar."
          })
        ])
      ]),
      createElement("section", {
        className: "grid gap-4",
        attributes: { "aria-label": "Solicitações de reserva" }
      }, page.content.length
        ? page.content.map(requestCard)
        : createEmptyState("Nenhuma solicitação", "Novos pedidos aparecerão aqui."))
    ]);
    main.className = "page";
  } catch (error) {
    protectedError(error, main);
  }
}

function detailList(request) {
  const items = [
    ["Quadra", request.courtName],
    ["Esporte", request.sport],
    ["Data e hora", formatDateTime(request.startsAt)],
    ["Participantes", String(request.participants)],
    ["Valor", formatCurrency(request.amount, request.currency)]
  ];
  return createElement("dl", { className: "grid sm:grid-cols-2 gap-5 mt-6" },
    items.map(([label, value]) => createElement("div", {}, [
      createElement("dt", { className: "muted text-xs", text: label }),
      createElement("dd", { className: "font-bold mt-1", text: value })
    ])));
}

export async function initializeOwnerRequestPage() {
  const main = document.querySelector("main");
  const requestId = getQueryParameter("request");
  if (!main || !requestId) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando o pedido…"));
  try {
    const request = await api.bookings.get(requestId);
    const accept = createElement("button", {
      className: "btn btn-primary",
      attributes: { type: "button" },
      text: "Aceitar solicitação"
    });
    const status = createElement("p", {
      className: "help mt-4",
      attributes: { role: "status", "aria-live": "polite" }
    });
    accept.addEventListener("click", async () => {
      accept.disabled = true;
      status.textContent = "Reservando o horário…";
      try {
        const reservation = await api.bookings.accept(requestId);
        navigate(`../solicitacao-aceita/?reservation=${encodeURIComponent(reservation.id)}&request=${encodeURIComponent(requestId)}`);
      } catch (error) {
        status.textContent = error instanceof ApiError ? error.message : "Não foi possível aceitar a solicitação.";
        accept.disabled = false;
      }
    });
    replaceChildren(main, createElement("section", { className: "card p-7 max-w-2xl mx-auto" }, [
      createElement("p", { className: "eyebrow", text: `Pedido de ${request.requesterName}` }),
      createElement("h1", { className: "title-lg mt-2", text: `Pedido para ${formatDateTime(request.startsAt)}` }),
      detailList(request),
      request.message
        ? createElement("div", { className: "soft-panel mt-6" }, [
            createElement("strong", { className: "text-sm", text: "Mensagem" }),
            createElement("p", { className: "text-sm muted mt-2", text: request.message })
          ])
        : null,
      request.status === "PENDING"
        ? createElement("div", { className: "flex flex-wrap gap-3 mt-7" }, [
            accept,
            createElement("a", {
              className: "btn btn-secondary",
              attributes: { href: `../sugerir-horario/?request=${encodeURIComponent(requestId)}` },
              text: "Sugerir horário"
            }),
            createElement("a", {
              className: "btn btn-danger",
              attributes: { href: `../recusar-solicitacao/?request=${encodeURIComponent(requestId)}` },
              text: "Recusar"
            })
          ])
        : createElement("span", {
            className: `badge ${(requestLabels[request.status] || [null, "badge-neutral"])[1]} mt-7`,
            text: (requestLabels[request.status] || [request.status])[0]
          }),
      status
    ].filter(Boolean)));
  } catch (error) {
    protectedError(error, main);
  }
}

export async function initializeRejectRequestPage() {
  const main = document.querySelector("main");
  const form = main?.querySelector("form");
  const requestId = getQueryParameter("request");
  if (!main || !(form instanceof HTMLFormElement) || !requestId) {
    return;
  }
  try {
    const request = await api.bookings.get(requestId);
    const eyebrow = main.querySelector(".eyebrow");
    if (eyebrow) {
      eyebrow.textContent = `Pedido de ${request.requesterName}`;
    }
    const details = form.querySelector("#details");
    if (details) {
      details.name = "details";
      details.maxLength = 500;
    }
    const counterLink = form.querySelector("a[href*='sugerir-horario']");
    if (counterLink) {
      counterLink.href = `../sugerir-horario/?request=${encodeURIComponent(requestId)}`;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const selected = form.querySelector("input[name='reason']:checked");
      const reasonLabel = selected?.closest("label")?.textContent.trim() || "";
      const reason = [reasonLabel, details?.value.trim()].filter(Boolean).join(": ");
      setFormBusy(form, true);
      try {
        await api.bookings.reject(requestId, reason);
        notify("Solicitação recusada.");
        navigate("../solicitacoes/");
      } catch (error) {
        showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível recusar a solicitação.");
      } finally {
        setFormBusy(form, false);
      }
    });
  } catch (error) {
    protectedError(error, main);
  }
}

export async function initializeCounterRequestPage() {
  const main = document.querySelector("main");
  const form = main?.querySelector("form");
  const requestId = getQueryParameter("request");
  if (!main || !(form instanceof HTMLFormElement) || !requestId) {
    return;
  }
  try {
    const request = await api.bookings.get(requestId);
    const dateInput = form.querySelector("#proposed-date");
    const timeSelect = form.querySelector("#proposed-time");
    const message = form.querySelector("#message");
    if (dateInput) {
      dateInput.name = "date";
      dateInput.min = new Date().toISOString().slice(0, 10);
    }
    if (timeSelect) {
      timeSelect.name = "time";
      replaceChildren(timeSelect, [
        createElement("option", { attributes: { value: "" }, text: "Selecione" }),
        ...["08:00", "10:00", "18:00", "19:00", "20:00", "21:00"].map((time) =>
          createElement("option", { attributes: { value: time }, text: time }))
      ]);
    }
    if (message) {
      message.name = "message";
      message.maxLength = 500;
    }
    const amountInput = createElement("input", {
      className: "field",
      attributes: {
        id: "counter-amount",
        name: "amount",
        type: "number",
        min: "0",
        step: "0.01",
        value: request.amount,
        required: true
      }
    });
    form.querySelector(".grid")?.append(createElement("div", { className: "field-group sm:col-span-2" }, [
      createElement("label", {
        className: "label",
        attributes: { for: "counter-amount" },
        text: "Novo valor"
      }),
      amountInput
    ]));
    const description = main.querySelector(".lead");
    if (description) {
      description.textContent = `${request.requesterName} pediu ${formatDateTime(request.startsAt)}.`;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const startsAt = toIsoDateTime(dateInput.value, timeSelect.value);
      if (!startsAt) {
        showFormMessage(form, "Escolha uma nova data e horário.");
        return;
      }
      const originalMinutes = Math.max(
        30,
        Math.round((new Date(request.endsAt) - new Date(request.startsAt)) / 60000)
      );
      setFormBusy(form, true);
      try {
        await api.bookings.counter(requestId, {
          startsAt,
          endsAt: addMinutes(startsAt, originalMinutes),
          amount: Number(amountInput.value),
          message: message?.value.trim() || null
        });
        notify("Novo horário enviado.");
        navigate("../solicitacoes/");
      } catch (error) {
        showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível enviar a sugestão.");
      } finally {
        setFormBusy(form, false);
      }
    });
  } catch (error) {
    protectedError(error, main);
  }
}

export async function initializeOwnerAcceptedPage() {
  const main = document.querySelector("main");
  const reservationId = getQueryParameter("reservation");
  if (!main || !reservationId) {
    return;
  }
  replaceChildren(main, createLoadingState("Confirmando a resposta…"));
  try {
    const reservation = await api.bookings.reservation(reservationId);
    replaceChildren(main, createElement("section", { className: "card p-8 text-center max-w-xl mx-auto" }, [
      createElement("span", { className: "empty-icon" },
        createElement("i", {
          className: "fa-solid fa-check",
          attributes: { "aria-hidden": "true" }
        })),
      createElement("p", { className: "eyebrow mt-5", text: "Solicitação aceita" }),
      createElement("h1", { className: "title-lg mt-2", text: "Horário liberado para pagamento." }),
      createElement("p", {
        className: "lead mt-3",
        text: `${reservation.courtName} · ${formatDateTime(reservation.startsAt)}`
      }),
      createElement("div", { className: "flex gap-3 justify-center mt-7" }, [
        createElement("a", {
          className: "btn btn-primary",
          attributes: { href: "../solicitacoes/" },
          text: "Voltar às solicitações"
        }),
        createElement("a", {
          className: "btn btn-secondary",
          attributes: {
            href: `../chat/?request=${encodeURIComponent(reservation.rentalRequestId)}&mode=owner`
          },
          text: "Enviar mensagem"
        })
      ])
    ]));
  } catch (error) {
    protectedError(error, main);
  }
}

function upcomingReservations(reservations) {
  const now = Date.now();
  return reservations
    .filter((reservation) =>
      new Date(reservation.startsAt).getTime() >= now &&
      !["CANCELLED", "COMPLETED"].includes(reservation.status))
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
}

export async function initializeOwnerDashboardPage() {
  const main = document.querySelector("main");
  if (!main) {
    return;
  }
  replaceChildren(main, createLoadingState("Preparando seu painel…"));
  try {
    const [user, courts, requests, reservations] = await Promise.all([
      api.me(),
      api.courts.mine(),
      api.bookings.owner(),
      api.bookings.ownerReservations()
    ]);
    const pending = requests.content.filter((request) => request.status === "PENDING");
    const confirmed = reservations.content.filter((reservation) => reservation.status === "CONFIRMED");
    const revenue = confirmed.reduce((total, reservation) => total + Number(reservation.amount), 0);
    const upcoming = upcomingReservations(reservations.content);
    replaceChildren(main, [
      createElement("div", { className: "section-head" }, [
        createElement("div", {}, [
          createElement("p", {
            className: "eyebrow",
            text: new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date())
          }),
          createElement("h1", { className: "title-lg mt-2", text: `Olá, ${user.displayName.split(" ")[0]}.` }),
          createElement("p", {
            className: "lead mt-2",
            text: pending.length === 1
              ? "Há uma solicitação esperando sua resposta."
              : `Há ${pending.length} solicitações esperando sua resposta.`
          })
        ]),
        createElement("a", {
          className: "btn btn-primary",
          attributes: { href: "../anunciar/" },
          text: "Cadastrar quadra"
        })
      ]),
      createElement("section", { className: "stat-row", attributes: { "aria-label": "Resumo" } }, [
        statCard("Quadras cadastradas", courts.totalElements),
        statCard("Reservas confirmadas", confirmed.length),
        statCard("Receita confirmada", formatCurrency(revenue))
      ]),
      createElement("div", { className: "split mt-8" }, [
        createElement("section", {}, [
          createElement("div", { className: "section-head" }, [
            createElement("h2", { className: "title-md", text: "Precisam de resposta" }),
            createElement("a", {
              className: "link text-sm",
              attributes: { href: "../solicitacoes/" },
              text: "Ver todas"
            })
          ]),
          createElement("div", { className: "grid gap-3" },
            pending.length
              ? pending.slice(0, 4).map(requestCard)
              : createElement("p", { className: "muted text-sm", text: "Nenhum pedido pendente." }))
        ]),
        createElement("aside", { className: "panel sidebar" }, [
          createElement("h2", { className: "title-md", text: "Próximos jogos" }),
          createElement("div", { className: "timeline mt-5" },
            upcoming.length
              ? upcoming.slice(0, 5).map((reservation) => createElement("div", { className: "timeline-item" }, [
                  createElement("span", { className: "timeline-dot" }),
                  createElement("div", {}, [
                    createElement("strong", {
                      className: "text-sm",
                      text: formatDateTime(reservation.startsAt)
                    }),
                    createElement("p", {
                      className: "help",
                      text: `${reservation.courtName} · ${reservation.sport}`
                    })
                  ])
                ]))
              : createElement("p", { className: "muted text-sm", text: "Nenhuma reserva próxima." })),
          createElement("a", {
            className: "btn btn-secondary btn-block",
            attributes: { href: "../agenda-proprietario/" },
            text: "Abrir agenda"
          })
        ])
      ])
    ]);
    main.className = "page";
  } catch (error) {
    protectedError(error, main);
  }
}

function statCard(label, value) {
  return createElement("div", { className: "panel" }, [
    createElement("div", { className: "stat" }, [
      createElement("span", { className: "muted text-xs", text: label }),
      createElement("strong", { text: value })
    ])
  ]);
}

function agendaRow(reservation) {
  return createElement("article", { className: "panel" }, [
    createElement("div", { className: "flex flex-wrap justify-between gap-4" }, [
      createElement("div", {}, [
        createElement("span", {
          className: reservation.status === "CONFIRMED" ? "badge badge-success" : "badge badge-warning",
          text: reservation.status === "CONFIRMED" ? "Confirmada" : "Aguardando pagamento"
        }),
        createElement("h2", { className: "font-bold mt-3", text: reservation.courtName }),
        createElement("p", {
          className: "help mt-1",
          text: `${formatDateTime(reservation.startsAt)} · ${reservation.sport}`
        })
      ]),
      createElement("div", { className: "text-right" }, [
        createElement("strong", { text: formatCurrency(reservation.amount, reservation.currency) }),
        createElement("p", { className: "help mt-1", text: reservation.confirmationCode })
      ])
    ])
  ]);
}

export async function initializeOwnerAgendaPage() {
  const main = document.querySelector("main");
  if (!main) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando a agenda…"));
  try {
    const [courts, reservations] = await Promise.all([
      api.courts.mine(),
      api.bookings.ownerReservations()
    ]);
    const select = createElement("select", {
      className: "field w-auto",
      attributes: { "aria-label": "Escolher quadra" }
    }, [
      createElement("option", { attributes: { value: "" }, text: "Todas as quadras" }),
      ...courts.content.map((court) => createElement("option", {
        attributes: { value: court.id },
        text: court.name
      }))
    ]);
    const list = createElement("section", {
      className: "grid gap-3",
      attributes: { "aria-label": "Reservas da agenda" }
    });
    const render = () => {
      const selected = select.value;
      const items = upcomingReservations(reservations.content)
        .filter((reservation) => !selected || reservation.courtId === selected);
      replaceChildren(
        list,
        items.length
          ? items.map(agendaRow)
          : createEmptyState("Agenda livre", "Não há reservas futuras para esta seleção.")
      );
    };
    select.addEventListener("change", render);
    replaceChildren(main, [
      createElement("div", { className: "section-head" }, [
        createElement("div", {}, [
          createElement("p", { className: "eyebrow", text: "Área do proprietário" }),
          createElement("h1", { className: "title-lg mt-2", text: "Agenda" }),
          createElement("p", {
            className: "lead mt-2",
            text: "Acompanhe reservas confirmadas e horários aguardando pagamento."
          })
        ]),
        select
      ]),
      list
    ]);
    main.className = "page";
    render();
  } catch (error) {
    protectedError(error, main);
  }
}
