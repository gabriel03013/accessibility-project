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
import { addMinutes, formatCurrency, formatDateTime, toIsoDateTime } from "./format.js?v=20260727-9";

const requestLabels = {
  PENDING: ["Aguardando proprietário", "badge-warning"],
  COUNTER_PROPOSED: ["Novo horário sugerido", "badge-accent"],
  ACCEPTED: ["Aprovada", "badge-success"],
  REJECTED: ["Recusada", "badge-danger"],
  CANCELLED: ["Cancelada", "badge-neutral"],
  EXPIRED: ["Expirada", "badge-neutral"]
};

const reservationLabels = {
  AWAITING_PAYMENT: ["Aguardando pagamento", "badge-warning"],
  CONFIRMED: ["Confirmada", "badge-success"],
  IN_PROGRESS: ["Em andamento", "badge-brand"],
  COMPLETED: ["Concluída", "badge-neutral"],
  CANCELLED: ["Cancelada", "badge-danger"],
  NO_SHOW: ["Não compareceu", "badge-danger"]
};

function handleProtectedError(error, container) {
  if (error instanceof ApiError && error.status === 401) {
    navigate(loginPath());
    return true;
  }
  if (container) {
    replaceChildren(container, createEmptyState(
      "Não foi possível carregar",
      error instanceof ApiError ? error.message : "Tente novamente em instantes."
    ));
  }
  return false;
}

function summaryList(entries) {
  const list = createElement("dl", { className: "divider pt-4 mt-4 grid gap-3 text-sm" });
  for (const [label, value] of entries) {
    list.append(createElement("div", { className: "flex justify-between gap-4" }, [
      createElement("dt", { className: "muted", text: label }),
      createElement("dd", { className: "font-bold text-right", text: value })
    ]));
  }
  return list;
}

function createInputGroup(label, input) {
  const id = input.getAttribute("id");
  return createElement("div", { className: "field-group" }, [
    createElement("label", {
      className: "label",
      attributes: { for: id },
      text: label
    }),
    input
  ]);
}

function localDateValue(daysAhead = 1) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export async function initializeBookingRequestPage() {
  const main = document.querySelector("main");
  const form = document.querySelector("main form");
  const aside = document.querySelector("main aside");
  const courtId = getQueryParameter("court");
  const slug = getQueryParameter("slug");
  const sportId = getQueryParameter("sport");
  if (!main || !(form instanceof HTMLFormElement) || !aside || !courtId || !slug || !sportId) {
    return;
  }
  const content = Array.from(main.children);
  const loading = createLoadingState("Preparando sua solicitação…");
  for (const node of content) {
    node.hidden = true;
  }
  main.prepend(loading);

  try {
    const court = await api.courts.get(slug);
    const sport = court.sports.find((item) => String(item.id) === sportId);
    if (!sport) {
      throw new ApiError(404, "SPORT_NOT_FOUND", "Esta modalidade não está disponível na quadra.");
    }

    const dateInput = createElement("input", {
      className: "field",
      attributes: {
        id: "booking-date",
        name: "date",
        type: "date",
        min: localDateValue(),
        value: localDateValue(),
        required: true
      }
    });
    const timeInput = createElement("input", {
      className: "field",
      attributes: {
        id: "booking-time",
        name: "time",
        type: "time",
        value: "19:00",
        required: true
      }
    });
    const durationSelect = createElement("select", {
      className: "field",
      attributes: { id: "booking-duration", name: "duration" }
    }, [60, 90, 120, 180].map((minutes) => createElement("option", {
      attributes: { value: minutes },
      text: minutes < 60 ? `${minutes} minutos` : `${minutes / 60}h`
    })));
    const participantsInput = createElement("input", {
      className: "field",
      attributes: {
        id: "booking-participants",
        name: "participants",
        type: "number",
        min: "1",
        max: sport.maxParticipants || "200",
        value: "10",
        required: true
      }
    });
    const schedulePanel = createElement("fieldset", { className: "panel" }, [
      createElement("legend", { className: "title-md px-1", text: "Quando será o jogo?" }),
      createElement("div", { className: "grid sm:grid-cols-2 gap-5 mt-5" }, [
        createInputGroup("Data", dateInput),
        createInputGroup("Horário inicial", timeInput),
        createInputGroup("Duração", durationSelect),
        createInputGroup("Participantes", participantsInput)
      ])
    ]);
    form.prepend(schedulePanel);

    const groupFieldset = form.querySelector("fieldset.panel:not(:first-child)");
    if (groupFieldset) {
      const choices = groupFieldset.querySelector(".grid");
      if (choices) {
        replaceChildren(choices, createElement("label", { className: "choice" }, [
          createElement("input", {
            attributes: {
              type: "radio",
              name: "teamId",
              value: "",
              checked: true
            }
          }),
          createElement("span", {}, [
            createElement("strong", { className: "text-sm", text: "Reserva individual" }),
            createElement("span", {
              className: "help block mt-1",
              text: "Você organiza os participantes por conta própria."
            })
          ])
        ]));
        try {
          const teams = await api.teams.mine();
          for (const team of teams.filter((item) => item.sports.includes(sport.name))) {
            choices.prepend(createElement("label", { className: "choice" }, [
              createElement("input", {
                attributes: {
                  type: "radio",
                  name: "teamId",
                  value: team.id
                }
              }),
              createElement("span", {}, [
                createElement("strong", {
                  className: "text-sm",
                  text: `Meu time: ${team.name}`
                }),
                createElement("span", {
                  className: "help block mt-1",
                  text: `${team.members.length} membros · ${team.sports.join(" e ")}`
                })
              ])
            ]));
          }
        } catch {
        }
      }
    }

    const messageInput = form.querySelector("#message");
    if (messageInput) {
      messageInput.name = "message";
      messageInput.maxLength = 1000;
    }

    const updateSummary = () => {
      const amount = Number(sport.pricePerHour) * Number(durationSelect.value) / 60;
      replaceChildren(aside, [
        createElement("h2", { className: "font-bold", text: court.name }),
        createElement("p", {
          className: "muted text-xs mt-1",
          text: [court.address.neighborhood, court.address.city].filter(Boolean).join(", ")
        }),
        summaryList([
          ["Modalidade", sport.name],
          ["Data e hora", `${dateInput.value || "Escolha a data"} · ${timeInput.value || "--:--"}`],
          ["Total após aprovação", formatCurrency(amount)]
        ]),
        createElement("p", {
          className: "help mt-4",
          text: "Nenhuma cobrança será feita agora."
        })
      ]);
    };
    for (const control of [dateInput, timeInput, durationSelect]) {
      control.addEventListener("change", updateSummary);
    }
    updateSummary();
    loading.remove();
    for (const node of content) {
      node.hidden = false;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const startsAt = toIsoDateTime(dateInput.value, timeInput.value);
      if (!startsAt) {
        showFormMessage(form, "Escolha uma data e um horário válidos.");
        return;
      }
      setFormBusy(form, true);
      showFormMessage(form, "", "success");
      try {
        const request = await api.bookings.create({
          courtId,
          sportId: Number(sportId),
          teamId: form.elements.teamId?.value || null,
          startsAt,
          endsAt: addMinutes(startsAt, Number(durationSelect.value)),
          participants: Number(participantsInput.value),
          message: messageInput?.value.trim() || null
        });
        navigate(`../solicitacao-enviada/?request=${encodeURIComponent(request.id)}`);
      } catch (error) {
        if (!handleProtectedError(error)) {
          showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível enviar sua solicitação.");
        }
      } finally {
        setFormBusy(form, false);
      }
    });
  } catch (error) {
    handleProtectedError(error, document.querySelector("main"));
  }
}

function requestSummary(request) {
  const [label, badgeClass] = requestLabels[request.status] || [request.status, "badge-neutral"];
  return createElement("div", { className: "soft-panel text-left mt-7 max-w-xl mx-auto" }, [
    createElement("div", { className: "flex justify-between gap-4" }, [
      createElement("div", {}, [
        createElement("strong", { text: request.courtName }),
        createElement("p", {
          className: "muted text-sm mt-1",
          text: `${formatDateTime(request.startsAt)} · ${request.sport}`
        })
      ]),
      createElement("span", { className: `badge ${badgeClass}`, text: label })
    ])
  ]);
}

export async function initializeRequestSentPage() {
  const main = document.querySelector("main");
  const requestId = getQueryParameter("request");
  if (!main || !requestId) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando sua solicitação…"));
  try {
    const request = await api.bookings.get(requestId);
    const section = createElement("section", { className: "card p-8 text-center" }, [
      createElement("span", { className: "empty-icon" },
        createElement("i", {
          className: "fa-regular fa-clock",
          attributes: { "aria-hidden": "true" }
        })),
      createElement("p", { className: "eyebrow mt-5", text: `Pedido ${request.id.slice(0, 8).toUpperCase()}` }),
      createElement("h1", { className: "title-lg mt-2", text: "Solicitação enviada." }),
      createElement("p", {
        className: "lead mt-4 max-w-xl mx-auto",
        text: "O proprietário recebeu seu pedido. Você verá aqui quando ele aprovar, recusar ou sugerir outro horário."
      }),
      requestSummary(request),
      createElement("div", { className: "flex flex-wrap gap-3 justify-center mt-7" }, [
        createElement("a", {
          className: "btn btn-primary",
          attributes: { href: "../minhas-reservas/" },
          text: "Acompanhar solicitação"
        }),
        createElement("a", {
          className: "btn btn-secondary",
          attributes: { href: `../chat/?request=${encodeURIComponent(request.id)}` },
          text: "Abrir conversa"
        })
      ])
    ]);
    replaceChildren(main, section);
  } catch (error) {
    handleProtectedError(error, main);
  }
}

function reservationCard(reservation) {
  const [label, badgeClass] = reservationLabels[reservation.status] || [reservation.status, "badge-neutral"];
  const action = reservation.status === "AWAITING_PAYMENT"
    ? createElement("a", {
        className: "btn btn-accent",
        attributes: { href: `../pagamento/?reservation=${encodeURIComponent(reservation.id)}` },
        text: "Pagar agora"
      })
    : createElement("a", {
        className: "btn btn-secondary",
        attributes: { href: `../confirmacao/?reservation=${encodeURIComponent(reservation.id)}` },
        text: "Ver detalhes"
      });
  return createElement("article", { className: "panel" }, [
    createElement("div", { className: "grid md:grid-cols-4 gap-5 items-center" }, [
      createElement("div", { className: "md:col-span-2" }, [
        createElement("span", { className: `badge ${badgeClass}`, text: label }),
        createElement("h2", { className: "font-bold mt-2", text: reservation.courtName }),
        createElement("p", {
          className: "help",
          text: `${formatDateTime(reservation.startsAt)} · ${reservation.sport}`
        })
      ]),
      createElement("p", {
        className: "text-sm font-bold",
        text: formatCurrency(reservation.amount, reservation.currency)
      }),
      action
    ])
  ]);
}

function rentalRequestCard(request) {
  const [label, badgeClass] = requestLabels[request.status] || [request.status, "badge-neutral"];
  let action = createElement("a", {
    className: "btn btn-secondary",
    attributes: { href: `../chat/?request=${encodeURIComponent(request.id)}` },
    text: "Mensagem"
  });
  if (request.status === "COUNTER_PROPOSED") {
    action = createElement("a", {
      className: "btn btn-primary",
      attributes: { href: `../responder-sugestao/?request=${encodeURIComponent(request.id)}` },
      text: "Responder sugestão"
    });
  }
  return createElement("article", { className: "panel" }, [
    createElement("div", { className: "grid md:grid-cols-4 gap-5 items-center" }, [
      createElement("div", { className: "md:col-span-2" }, [
        createElement("span", { className: `badge ${badgeClass}`, text: label }),
        createElement("h2", { className: "font-bold mt-2", text: request.courtName }),
        createElement("p", {
          className: "help",
          text: `${formatDateTime(request.startsAt)} · ${request.sport}`
        })
      ]),
      createElement("p", {
        className: "text-sm muted",
        text: formatCurrency(request.amount, request.currency)
      }),
      action
    ])
  ]);
}

export async function initializeMyBookingsPage() {
  const list = document.querySelector("#active-bookings");
  if (!list) {
    return;
  }
  replaceChildren(list, createLoadingState("Organizando suas reservas…"));
  try {
    const [requests, reservations] = await Promise.all([
      api.bookings.mine(),
      api.bookings.reservations()
    ]);
    const reservedRequestIds = new Set(reservations.content.map((item) => item.rentalRequestId));
    const entries = [
      ...reservations.content.map((item) => ({ date: item.createdAt, node: reservationCard(item) })),
      ...requests.content
        .filter((item) => !reservedRequestIds.has(item.id))
        .map((item) => ({ date: item.createdAt, node: rentalRequestCard(item) }))
    ].sort((left, right) => new Date(right.date) - new Date(left.date));
    replaceChildren(
      list,
      entries.length
        ? entries.map((entry) => entry.node)
        : createEmptyState("Nenhuma reserva ainda", "Quando você pedir uma quadra, o andamento aparecerá aqui.")
    );
  } catch (error) {
    handleProtectedError(error, list);
  }
}

function paymentSummary(reservation) {
  return createElement("aside", { className: "panel sidebar" }, [
    createElement("span", { className: "badge badge-success", text: "Solicitação aprovada" }),
    createElement("h2", { className: "font-bold mt-4", text: reservation.courtName }),
    createElement("p", {
      className: "muted text-xs mt-1",
      text: `${formatDateTime(reservation.startsAt)} · ${reservation.sport}`
    }),
    summaryList([
      ["Total", formatCurrency(reservation.amount, reservation.currency)]
    ])
  ]);
}

export async function initializePaymentChoicePage() {
  const main = document.querySelector("main");
  const reservationId = getQueryParameter("reservation");
  if (!main || !reservationId) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando o pagamento…"));
  try {
    const reservation = await api.bookings.reservation(reservationId);
    const status = createElement("p", {
      className: "help text-center mt-4",
      attributes: { role: "status", "aria-live": "polite" }
    });
    const button = createElement("button", {
      className: "btn btn-primary btn-block mt-7",
      attributes: { type: "button" },
      text: `Pagar ${formatCurrency(reservation.amount, reservation.currency)}`
    });
    button.addEventListener("click", () => startPayment(
      reservationId,
      button,
      status
    ));
    const section = createElement("section");
    replaceChildren(section, [
      createElement("p", { className: "eyebrow", text: "Pagamento simulado" }),
      createElement("h1", { className: "title-lg mt-2", text: "Confirmar pagamento" }),
      createElement("p", {
        className: "lead mt-3",
        text: "Este é um ambiente de demonstração. Nenhum dado bancário será solicitado e nenhuma cobrança real será feita."
      }),
      createElement("div", { className: "soft-panel mt-7 flex gap-3 text-sm" }, [
        createElement("i", {
          className: "fa-solid fa-circle-info text-brand mt-1",
          attributes: { "aria-hidden": "true" }
        }),
        createElement("p", {
          text: "Ao clicar em pagar, a reserva será confirmada imediatamente."
        })
      ]),
      button,
      status
    ]);
    replaceChildren(main, [
      createElement("ol", { className: "steps" }, [
        createElement("li", { className: "step is-done" }, [
          createElement("span", { className: "step-number" }, createElement("i", {
            className: "fa-solid fa-check",
            attributes: { "aria-hidden": "true" }
          })),
          createElement("span", { text: "Solicitação" })
        ]),
        createElement("li", { className: "step is-done" }, [
          createElement("span", { className: "step-number" }, createElement("i", {
            className: "fa-solid fa-check",
            attributes: { "aria-hidden": "true" }
          })),
          createElement("span", { text: "Aprovação" })
        ]),
        createElement("li", { className: "step is-active" }, [
          createElement("span", { className: "step-number", text: "3" }),
          createElement("span", { text: "Pagamento" })
        ]),
        createElement("li", { className: "step" }, [
          createElement("span", { className: "step-number", text: "4" }),
          createElement("span", { text: "Confirmada" })
        ])
      ]),
      createElement("div", { className: "split" }, [
        section,
        paymentSummary(reservation)
      ])
    ]);
  } catch (error) {
    handleProtectedError(error, main);
  }
}

async function startPayment(reservationId, button, statusNode) {
  button.disabled = true;
  statusNode.textContent = "Confirmando pagamento…";
  try {
    const payment = await api.payments.pay(reservationId);
    statusNode.textContent = "Pagamento confirmado.";
    navigate(`../confirmacao/?reservation=${encodeURIComponent(payment.reservationId)}`);
  } catch (error) {
    statusNode.textContent = error instanceof ApiError
      ? error.message
      : "Não foi possível confirmar o pagamento.";
    button.disabled = false;
  }
}

export async function initializeConfirmationPage() {
  const main = document.querySelector("main");
  const reservationId = getQueryParameter("reservation");
  if (!main || !reservationId) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando a confirmação…"));
  try {
    const reservation = await api.bookings.reservation(reservationId);
    const confirmed = reservation.status === "CONFIRMED";
    replaceChildren(main, createElement("section", { className: "card p-8 text-center" }, [
      createElement("span", { className: "empty-icon" },
        createElement("i", {
          className: confirmed ? "fa-solid fa-check" : "fa-regular fa-clock",
          attributes: { "aria-hidden": "true" }
        })),
      createElement("p", {
        className: "eyebrow mt-5",
        text: confirmed ? "Pagamento aprovado" : "Pagamento pendente"
      }),
      createElement("h1", {
        className: "title-lg mt-2",
        text: confirmed ? "Quadra confirmada." : "O pagamento ainda não foi realizado."
      }),
      createElement("p", {
        className: "lead mt-3",
        text: `${reservation.courtName} · ${formatDateTime(reservation.startsAt)}`
      }),
      createElement("div", { className: "soft-panel text-left mt-7 max-w-xl mx-auto" }, [
        summaryList([
          ["Esporte", reservation.sport],
          ["Código", reservation.confirmationCode],
          ["Total", formatCurrency(reservation.amount, reservation.currency)]
        ])
      ]),
      createElement("a", {
        className: "btn btn-primary mt-7",
        attributes: { href: "../minhas-reservas/" },
        text: "Ver minhas reservas"
      })
    ]));
  } catch (error) {
    handleProtectedError(error, main);
  }
}

export async function initializeCounterResponsePage() {
  const main = document.querySelector("main");
  const requestId = getQueryParameter("request");
  if (!main || !requestId) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando a sugestão…"));
  try {
    const [request, proposals] = await Promise.all([
      api.bookings.get(requestId),
      api.bookings.proposals(requestId)
    ]);
    const proposal = proposals.find((item) => item.status === "PENDING");
    if (!proposal) {
      replaceChildren(main, createEmptyState("Sugestão indisponível", "Ela pode já ter sido respondida."));
      return;
    }
    const status = createElement("p", {
      className: "help mt-4",
      attributes: { role: "status", "aria-live": "polite" }
    });
    const accept = createElement("button", {
      className: "btn btn-primary flex-1",
      attributes: { type: "button" },
      text: "Aceitar e continuar"
    });
    const reject = createElement("button", {
      className: "btn btn-secondary flex-1",
      attributes: { type: "button" },
      text: "Recusar sugestão"
    });
    accept.addEventListener("click", async () => {
      accept.disabled = true;
      reject.disabled = true;
      try {
        const reservation = await api.bookings.acceptProposal(requestId, proposal.id);
        navigate(`../pagamento/?reservation=${encodeURIComponent(reservation.id)}`);
      } catch (error) {
        status.textContent = error instanceof ApiError ? error.message : "Não foi possível aceitar a sugestão.";
        accept.disabled = false;
        reject.disabled = false;
      }
    });
    reject.addEventListener("click", async () => {
      accept.disabled = true;
      reject.disabled = true;
      try {
        await api.bookings.rejectProposal(requestId, proposal.id);
        notify("Sugestão recusada.");
        navigate("../minhas-reservas/");
      } catch (error) {
        status.textContent = error instanceof ApiError ? error.message : "Não foi possível recusar a sugestão.";
        accept.disabled = false;
        reject.disabled = false;
      }
    });
    replaceChildren(main, createElement("section", { className: "card p-7 max-w-xl mx-auto" }, [
      createElement("span", { className: "badge badge-accent", text: "Novo horário sugerido" }),
      createElement("h1", {
        className: "title-lg mt-3",
        text: `${request.courtName} sugeriu outro horário.`
      }),
      createElement("div", { className: "soft-panel mt-6" }, [
        summaryList([
          ["Novo horário", formatDateTime(proposal.startsAt)],
          ["Valor", formatCurrency(proposal.amount, request.currency)]
        ]),
        proposal.message
          ? createElement("p", { className: "text-sm mt-4", text: proposal.message })
          : null
      ].filter(Boolean)),
      createElement("div", { className: "flex gap-3 mt-7" }, [accept, reject]),
      status
    ]));
  } catch (error) {
    handleProtectedError(error, main);
  }
}
