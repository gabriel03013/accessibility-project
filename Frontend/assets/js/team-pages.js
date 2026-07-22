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
import { addMinutes, formatDateTime, initials, toIsoDateTime } from "./format.js?v=20260727-9";

const skillLabels = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
  MIXED: "Misto"
};

const challengeLabels = {
  PENDING: "Aguardando resposta",
  NEGOTIATING: "Em negociação",
  ACCEPTED: "Aceito",
  DECLINED: "Recusado",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado"
};

function protectedError(error, container) {
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

function teamBadges(team) {
  return createElement("div", { className: "flex flex-wrap gap-2 mt-4" }, [
    ...team.sports.map((sport) => createElement("span", {
      className: "badge badge-brand",
      text: sport
    })),
    createElement("span", {
      className: "badge badge-neutral",
      text: skillLabels[team.skillLevel] || "Misto"
    })
  ]);
}

function teamCard(team, options = {}) {
  const link = `../time/?team=${encodeURIComponent(team.id)}`;
  const admin = team.members.find((member) => member.role === "ADMIN");
  const body = createElement("div", { className: "flex gap-4" }, [
    createElement("div", { className: "brand-symbol text-lg" },
      createElement("i", {
        className: "fa-solid fa-shield",
        attributes: { "aria-hidden": "true" }
      })),
    createElement("div", { className: "flex-1" }, [
      createElement("div", { className: "flex justify-between gap-3" }, [
        createElement("div", {}, [
          createElement("h2", { className: "title-md", text: team.name }),
          createElement("p", {
            className: "muted text-xs mt-1",
            text: options.own
              ? `${team.members.length} membros`
              : `Administrado por @${admin?.username || "time"} · ${team.members.length} membros`
          })
        ]),
        team.publicProfile
          ? createElement("span", { className: "badge badge-success", text: "Aceita desafios" })
          : createElement("span", { className: "badge badge-neutral", text: "Privado" })
      ]),
      team.description
        ? createElement("p", { className: "text-sm muted mt-4", text: team.description })
        : null,
      teamBadges(team),
      options.challenge
        ? createElement("div", { className: "divider mt-5 pt-5" },
            createElement("a", {
              className: "btn btn-primary",
              attributes: { href: `../desafiar-time/?target=${encodeURIComponent(team.id)}` },
              text: "Desafiar time"
            }))
        : null
    ].filter(Boolean))
  ]);
  return createElement("article", { className: "card card-hover p-5" },
    options.challenge
      ? body
      : createElement("a", { attributes: { href: link } }, body));
}

function invitationCard(invitation, remove) {
  const decline = createElement("button", {
    className: "btn btn-secondary",
    attributes: { type: "button" },
    text: "Recusar"
  });
  decline.addEventListener("click", async () => {
    decline.disabled = true;
    try {
      await api.teams.declineInvitation(invitation.id);
      remove();
      notify("Convite recusado.");
    } catch (error) {
      decline.disabled = false;
      notify(error instanceof ApiError ? error.message : "Não foi possível recusar o convite.", "error");
    }
  });
  return createElement("article", {
    className: "panel flex flex-wrap items-center justify-between gap-5"
  }, [
    createElement("div", { className: "flex items-center gap-4" }, [
      createElement("span", { className: "avatar", text: initials(invitation.teamName) }),
      createElement("div", {}, [
        createElement("strong", { text: invitation.teamName }),
        createElement("p", {
          className: "muted text-xs mt-1",
          text: invitation.message || "Você recebeu um convite para entrar no time."
        })
      ])
    ]),
    createElement("div", { className: "flex gap-2" }, [
      createElement("a", {
        className: "btn btn-primary",
        attributes: { href: `../convite-time/?invitation=${encodeURIComponent(invitation.id)}&team=${encodeURIComponent(invitation.teamId)}` },
        text: "Ver convite"
      }),
      decline
    ])
  ]);
}

function challengeCard(challenge) {
  return createElement("article", { className: "panel" }, [
    createElement("div", { className: "flex flex-wrap justify-between gap-4" }, [
      createElement("div", {}, [
        createElement("span", {
          className: challenge.status === "ACCEPTED" ? "badge badge-success" : "badge badge-warning",
          text: challengeLabels[challenge.status] || challenge.status
        }),
        createElement("h3", {
          className: "font-bold mt-3",
          text: `${challenge.challengerTeamName} × ${challenge.challengedTeamName}`
        }),
        createElement("p", {
          className: "help mt-1",
          text: `${challenge.sport} · expira em ${formatDateTime(challenge.expiresAt)}`
        })
      ]),
      createElement("a", {
        className: "btn btn-secondary",
        attributes: { href: `../chat-desafio/?challenge=${encodeURIComponent(challenge.id)}` },
        text: "Abrir conversa"
      })
    ])
  ]);
}

export async function initializeTeamsPage() {
  const main = document.querySelector("main");
  if (!main) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando seus times…"));
  try {
    const [teams, invitations, challenges] = await Promise.all([
      api.teams.mine(),
      api.teams.invitations(),
      api.teams.challenges()
    ]);
    const teamGrid = createElement("section", {
      className: "grid md:grid-cols-2 gap-5",
      attributes: { "aria-label": "Seus times" }
    });
    replaceChildren(
      teamGrid,
      teams.length
        ? teams.map((team) => teamCard(team, { own: true }))
        : createEmptyState("Você ainda não tem um time", "Crie um time e convide sua turma pelo nome de usuário.")
    );

    const invitationList = createElement("div", { className: "grid gap-3 mt-4" });
    const removeInvitation = (card) => {
      card.remove();
      if (!invitationList.children.length) {
        replaceChildren(invitationList, createElement("p", {
          className: "muted text-sm",
          text: "Nenhum convite pendente."
        }));
      }
    };
    for (const invitation of invitations) {
      let card;
      card = invitationCard(invitation, () => removeInvitation(card));
      invitationList.append(card);
    }
    if (!invitations.length) {
      invitationList.append(createElement("p", {
        className: "muted text-sm",
        text: "Nenhum convite pendente."
      }));
    }

    replaceChildren(main, [
      createElement("div", { className: "section-head" }, [
        createElement("div", {}, [
          createElement("p", { className: "eyebrow", text: "Sua turma" }),
          createElement("h1", { className: "title-lg mt-2", text: "Times" }),
          createElement("p", { className: "lead mt-2", text: "Organize as pessoas com quem você joga." })
        ]),
        createElement("div", { className: "flex gap-2" }, [
          createElement("a", {
            className: "btn btn-secondary",
            attributes: { href: "../descobrir-times/" },
            text: "Encontrar adversário"
          }),
          createElement("a", {
            className: "btn btn-primary",
            attributes: { href: "../criar-time/" },
            text: "Criar time"
          })
        ])
      ]),
      teamGrid,
      createElement("section", { className: "section-space" }, [
        createElement("h2", { className: "title-md", text: "Convites pendentes" }),
        invitationList
      ]),
      createElement("section", { className: "section-space" }, [
        createElement("h2", { className: "title-md", text: "Desafios recentes" }),
        createElement("div", { className: "grid gap-3 mt-4" },
          challenges.length
            ? challenges.map(challengeCard)
            : createElement("p", { className: "muted text-sm", text: "Nenhum desafio por enquanto." }))
      ])
    ]);
    main.className = "page";
  } catch (error) {
    protectedError(error, main);
  }
}

export async function initializeCreateTeamPage() {
  const form = document.querySelector("main form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const nameInput = form.querySelector("#team-name");
  const descriptionInput = form.querySelector("#team-description");
  if (nameInput) {
    nameInput.name = "name";
    nameInput.maxLength = 100;
  }
  if (descriptionInput) {
    descriptionInput.name = "description";
    descriptionInput.maxLength = 1000;
  }

  const sportGrid = form.querySelector("fieldset .grid");
  try {
    const sports = await api.reference.sports();
    if (sportGrid) {
      replaceChildren(sportGrid, sports.map((sport) =>
        createElement("label", { className: "choice" }, [
          createElement("input", {
            attributes: {
              type: "checkbox",
              name: "sportIds",
              value: sport.id
            }
          }),
          createElement("span", {},
            createElement("strong", { className: "text-sm", text: sport.name }))
        ])));
    }
  } catch {
    showFormMessage(form, "Não foi possível carregar os esportes.");
  }

  const settings = createElement("fieldset", { className: "panel" }, [
    createElement("legend", { className: "title-md px-1", text: "Rotina do time" }),
    createElement("div", { className: "grid sm:grid-cols-2 gap-5 mt-5" }, [
      createElement("div", { className: "field-group" }, [
        createElement("label", {
          className: "label",
          attributes: { for: "skill-level" },
          text: "Nível"
        }),
        createElement("select", {
          className: "field",
          attributes: { id: "skill-level", name: "skillLevel" }
        }, Object.entries(skillLabels).map(([value, label]) =>
          createElement("option", { attributes: { value }, text: label })))
      ]),
      createElement("div", { className: "field-group" }, [
        createElement("label", {
          className: "label",
          attributes: { for: "max-members" },
          text: "Limite de membros"
        }),
        createElement("input", {
          className: "field",
          attributes: {
            id: "max-members",
            name: "maxMembers",
            type: "number",
            min: "2",
            max: "100",
            value: "20"
          }
        })
      ]),
      createElement("div", { className: "field-group sm:col-span-2" }, [
        createElement("label", {
          className: "label",
          attributes: { for: "routine" },
          text: "Quando vocês costumam jogar?"
        }),
        createElement("input", {
          className: "field",
          attributes: {
            id: "routine",
            name: "routine",
            type: "text",
            maxlength: "500",
            placeholder: "Ex.: quintas à noite"
          }
        })
      ]),
      createElement("label", { className: "choice sm:col-span-2" }, [
        createElement("input", {
          attributes: {
            type: "checkbox",
            name: "publicProfile",
            checked: true
          }
        }),
        createElement("span", {
          className: "text-sm",
          text: "Permitir que outros times encontrem este perfil para desafios."
        })
      ])
    ])
  ]);
  const sportFieldset = form.querySelector("fieldset");
  sportFieldset?.before(settings);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const sportIds = Array.from(form.querySelectorAll("input[name='sportIds']:checked"))
      .map((input) => Number(input.value));
    if (!sportIds.length) {
      showFormMessage(form, "Escolha pelo menos um esporte.");
      return;
    }
    setFormBusy(form, true);
    showFormMessage(form, "", "success");
    try {
      const team = await api.teams.create({
        name: form.elements.name.value.trim(),
        description: form.elements.description.value.trim() || null,
        skillLevel: form.elements.skillLevel.value,
        routine: form.elements.routine.value.trim() || null,
        maxMembers: Number(form.elements.maxMembers.value),
        publicProfile: form.elements.publicProfile.checked,
        sportIds
      });
      navigate(`../convidar-membros/?team=${encodeURIComponent(team.id)}`);
    } catch (error) {
      if (!protectedError(error)) {
        showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível criar o time.");
      }
    } finally {
      setFormBusy(form, false);
    }
  });
}

function memberItem(member) {
  return createElement("li", { className: "flex items-center gap-3" }, [
    createElement("span", { className: "avatar", text: initials(member.displayName) }),
    createElement("div", { className: "flex-1" }, [
      createElement("strong", { className: "text-sm", text: member.displayName }),
      createElement("p", {
        className: "help",
        text: `@${member.username}${member.role === "ADMIN" ? " · Administrador" : ""}`
      })
    ])
  ]);
}

export async function initializeTeamPage() {
  const main = document.querySelector("main");
  const teamId = getQueryParameter("team");
  if (!main || !teamId) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando o time…"));
  try {
    const team = await api.teams.get(teamId);
    document.title = `${team.name} — Partiu Quadra`;
    const members = createElement("aside", { className: "panel sidebar" }, [
      createElement("div", { className: "flex justify-between" }, [
        createElement("h2", { className: "title-md", text: "Membros" }),
        createElement("span", { className: "badge badge-neutral", text: team.members.length })
      ]),
      createElement("ul", { className: "mt-5 grid gap-4" }, team.members.map(memberItem))
    ]);
    replaceChildren(main, [
      createElement("div", { className: "soft-panel flex flex-wrap items-center justify-between gap-6" }, [
        createElement("div", { className: "flex items-center gap-5" }, [
          createElement("div", { className: "brand-symbol brand-symbol-lg" },
            createElement("i", {
              className: "fa-solid fa-shield",
              attributes: { "aria-hidden": "true" }
            })),
          createElement("div", {}, [
            teamBadges(team),
            createElement("h1", { className: "title-lg mt-3", text: team.name }),
            createElement("p", {
              className: "muted text-sm mt-2",
              text: `${team.members.length} membros · ${team.publicProfile ? "perfil público" : "perfil privado"}`
            })
          ])
        ]),
        createElement("div", { className: "flex flex-wrap gap-2" }, [
          createElement("a", {
            className: "btn btn-secondary",
            attributes: { href: `../descobrir-times/?from=${encodeURIComponent(team.id)}` },
            text: "Desafiar time"
          }),
          createElement("a", {
            className: "btn btn-primary",
            attributes: { href: `../convidar-membros/?team=${encodeURIComponent(team.id)}` },
            text: "Convidar"
          })
        ])
      ]),
      createElement("div", { className: "split mt-7" }, [
        createElement("section", {}, [
          createElement("h2", { className: "title-md", text: "Sobre o time" }),
          createElement("p", {
            className: "lead mt-3",
            text: team.description || "Este time ainda não adicionou uma descrição."
          }),
          team.routine
            ? createElement("div", { className: "soft-panel mt-6" }, [
                createElement("strong", { text: "Rotina" }),
                createElement("p", { className: "muted text-sm mt-2", text: team.routine })
              ])
            : null
        ].filter(Boolean)),
        members
      ])
    ]);
    main.className = "page";
    document.title = `${team.name} — Partiu Quadra`;
  } catch (error) {
    protectedError(error, main);
  }
}

export async function initializeInviteMembersPage() {
  const main = document.querySelector("main");
  const form = main?.querySelector("form");
  const teamId = getQueryParameter("team");
  if (!main || !(form instanceof HTMLFormElement) || !teamId) {
    return;
  }
  try {
    const team = await api.teams.get(teamId);
    const eyebrow = main.querySelector(".eyebrow");
    if (eyebrow) {
      eyebrow.textContent = team.name;
    }
    const input = form.querySelector("#username");
    if (input) {
      input.name = "username";
      input.required = true;
      input.maxLength = 32;
    }
    const result = form.closest("section")?.querySelector(".divider");
    if (result) {
      result.replaceChildren();
    }
    const sentList = main.querySelector("section[aria-labelledby='enviados'] .card");
    sentList?.replaceChildren();
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFormBusy(form, true);
      showFormMessage(form, "", "success");
      try {
        const invitation = await api.teams.invite(teamId, {
          username: input.value.trim(),
          message: `Você foi convidado para entrar no ${team.name}.`
        });
        sentList?.append(createElement("div", { className: "p-4 flex items-center gap-3" }, [
          createElement("span", { className: "avatar", text: initials(invitation.invitedUsername) }),
          createElement("div", { className: "flex-1" }, [
            createElement("strong", { className: "text-sm", text: `@${invitation.invitedUsername}` })
          ]),
          createElement("span", { className: "badge badge-warning", text: "Pendente" })
        ]));
        input.value = "";
        showFormMessage(form, "Convite enviado.", "success");
      } catch (error) {
        showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível enviar o convite.");
      } finally {
        setFormBusy(form, false);
      }
    });
    const finish = main.querySelector("a.btn-block");
    if (finish) {
      finish.href = `../time/?team=${encodeURIComponent(teamId)}`;
    }
  } catch (error) {
    protectedError(error, main);
  }
}

export async function initializeDiscoverTeamsPage() {
  const main = document.querySelector("main");
  const form = main?.querySelector("form.search-bar");
  const list = main?.querySelector("section[aria-label='Times encontrados']");
  if (!main || !(form instanceof HTMLFormElement) || !list) {
    return;
  }
  const query = getQueryParameter("q") || "";
  const sport = getQueryParameter("sport") || "";
  const level = getQueryParameter("level") || "";
  const searchInput = form.querySelector("#name");
  const sportSelect = form.querySelector("#sport");
  if (searchInput) {
    searchInput.name = "q";
    searchInput.value = query;
  }
  try {
    const sports = await api.reference.sports();
    if (sportSelect) {
      sportSelect.name = "sport";
      replaceChildren(sportSelect, [
        createElement("option", { attributes: { value: "" }, text: "Todos" }),
        ...sports.map((item) => createElement("option", {
          attributes: { value: item.slug },
          text: item.name
        }))
      ]);
      sportSelect.value = sport;
    }
  } catch {
  }
  const levelSelect = form.querySelector("#skill-level");
  if (levelSelect) {
    levelSelect.name = "level";
    levelSelect.value = level;
  }
  replaceChildren(list, createLoadingState("Procurando times…"));
  try {
    const page = await api.teams.search({ q: query, sport, level, size: 40 });
    const ownTeams = await api.teams.mine();
    const ownIds = new Set(ownTeams.map((team) => team.id));
    const available = page.content.filter((team) => !ownIds.has(team.id));
    replaceChildren(
      list,
      available.length
        ? available.map((team) => teamCard(team, { challenge: true }))
        : createEmptyState("Nenhum time encontrado", "Tente buscar outro nome ou esporte.")
    );
  } catch (error) {
    protectedError(error, list);
  }
}

function commonSportOptions(target, ownTeam, sports) {
  const commonNames = target.sports.filter((sport) => ownTeam.sports.includes(sport));
  return commonNames
    .map((name) => sports.find((sport) => sport.name === name))
    .filter(Boolean);
}

export async function initializeChallengeTeamPage() {
  const main = document.querySelector("main");
  const form = main?.querySelector("form");
  const targetId = getQueryParameter("target");
  if (!main || !(form instanceof HTMLFormElement) || !targetId) {
    return;
  }
  try {
    const [target, ownTeams, sports] = await Promise.all([
      api.teams.get(targetId),
      api.teams.mine(),
      api.reference.sports()
    ]);
    document.title = `Desafiar ${target.name} — Partiu Quadra`;
    const teamChoices = createElement("div", { className: "grid sm:grid-cols-2 gap-3 mt-5" });
    for (const team of ownTeams) {
      teamChoices.append(createElement("label", { className: "choice" }, [
        createElement("input", {
          attributes: {
            type: "radio",
            name: "challengerTeamId",
            value: team.id,
            checked: teamChoices.children.length === 0
          }
        }),
        createElement("span", {}, [
          createElement("strong", { className: "text-sm", text: team.name }),
          createElement("span", {
            className: "help block mt-1",
            text: `${team.members.length} membros`
          })
        ])
      ]));
    }
    const teamSection = form.querySelector("section.panel");
    if (teamSection) {
      replaceChildren(teamSection, [
        createElement("h2", { className: "title-md", text: `Qual time vai desafiar ${target.name}?` }),
        teamChoices
      ]);
    }

    const sportFieldset = form.querySelector("fieldset.panel");
    const sportChoices = sportFieldset?.querySelector(".grid");
    const refreshSports = () => {
      const selected = ownTeams.find((team) => team.id === form.elements.challengerTeamId?.value);
      const common = selected ? commonSportOptions(target, selected, sports) : [];
      if (sportChoices) {
        replaceChildren(
          sportChoices,
          common.length
            ? common.map((sport, index) => createElement("label", { className: "choice" }, [
                createElement("input", {
                  attributes: {
                    type: "radio",
                    name: "sportId",
                    value: sport.id,
                    checked: index === 0
                  }
                }),
                createElement("span", {},
                  createElement("strong", { className: "text-sm", text: sport.name }))
              ]))
            : createElement("p", {
                className: "muted text-sm",
                text: "Esses times ainda não têm uma modalidade em comum."
              })
        );
      }
    };
    teamChoices.addEventListener("change", refreshSports);
    refreshSports();

    const messageInput = form.querySelector("#message");
    if (messageInput) {
      messageInput.name = "message";
      messageInput.maxLength = 1000;
    }
    const heading = main.querySelector("h1");
    if (heading) {
      heading.textContent = `Desafiar ${target.name}`;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.elements.sportId?.value) {
        showFormMessage(form, "Escolha uma modalidade em comum.");
        return;
      }
      setFormBusy(form, true);
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const challenge = await api.teams.createChallenge(form.elements.challengerTeamId.value, {
          challengedTeamId: target.id,
          sportId: Number(form.elements.sportId.value),
          message: messageInput?.value.trim() || null,
          expiresAt: expiresAt.toISOString()
        });
        navigate(`../chat-desafio/?challenge=${encodeURIComponent(challenge.id)}`);
      } catch (error) {
        showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível enviar o desafio.");
      } finally {
        setFormBusy(form, false);
      }
    });
  } catch (error) {
    protectedError(error, main);
  }
}

export async function initializeInvitationPage() {
  const main = document.querySelector("main");
  const invitationId = getQueryParameter("invitation");
  const teamId = getQueryParameter("team");
  if (!main || !invitationId || !teamId) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando o convite…"));
  try {
    const [team, invitations] = await Promise.all([
      api.teams.get(teamId),
      api.teams.invitations()
    ]);
    const invitation = invitations.find((item) => item.id === invitationId);
    if (!invitation) {
      replaceChildren(main, createEmptyState("Convite indisponível", "Ele pode já ter sido respondido."));
      return;
    }
    document.title = `Convite para ${team.name} — Partiu Quadra`;
    const accept = createElement("button", {
      className: "btn btn-primary flex-1",
      attributes: { type: "button" },
      text: "Aceitar convite"
    });
    const decline = createElement("button", {
      className: "btn btn-secondary flex-1",
      attributes: { type: "button" },
      text: "Recusar"
    });
    accept.addEventListener("click", async () => {
      accept.disabled = true;
      decline.disabled = true;
      try {
        await api.teams.acceptInvitation(invitation.id);
        navigate(`../time/?team=${encodeURIComponent(team.id)}`);
      } catch (error) {
        notify(error instanceof ApiError ? error.message : "Não foi possível aceitar o convite.", "error");
        accept.disabled = false;
        decline.disabled = false;
      }
    });
    decline.addEventListener("click", async () => {
      accept.disabled = true;
      decline.disabled = true;
      try {
        await api.teams.declineInvitation(invitation.id);
        navigate("../times/");
      } catch (error) {
        notify(error instanceof ApiError ? error.message : "Não foi possível recusar o convite.", "error");
        accept.disabled = false;
        decline.disabled = false;
      }
    });
    replaceChildren(main, createElement("section", { className: "card overflow-hidden max-w-2xl mx-auto" }, [
      createElement("div", { className: "bg-surface-soft p-7 text-center" }, [
        createElement("span", { className: "avatar avatar-lg mx-auto", text: initials(team.name) }),
        createElement("p", { className: "eyebrow mt-5", text: "Convite para o time" }),
        createElement("h1", { className: "title-lg mt-2", text: team.name }),
        teamBadges(team)
      ]),
      createElement("div", { className: "p-7" }, [
        createElement("h2", { className: "title-md", text: "Sobre o time" }),
        createElement("p", {
          className: "lead mt-3",
          text: team.description || "O time ainda não adicionou uma descrição."
        }),
        invitation.message
          ? createElement("div", { className: "soft-panel mt-6" }, [
              createElement("strong", { className: "text-sm", text: "Recado do time" }),
              createElement("p", { className: "text-sm muted mt-2", text: invitation.message })
            ])
          : null,
        createElement("div", { className: "flex gap-3 mt-7" }, [accept, decline])
      ].filter(Boolean))
    ]));
  } catch (error) {
    protectedError(error, main);
  }
}

export async function initializeChallengeProposalPage() {
  const main = document.querySelector("main");
  const form = main?.querySelector("form");
  const challengeId = getQueryParameter("challenge");
  if (!main || !(form instanceof HTMLFormElement) || !challengeId) {
    return;
  }
  try {
    const [challenge, ownTeams, courts] = await Promise.all([
      api.teams.getChallenge(challengeId),
      api.teams.mine(),
      api.courts.saved()
    ]);
    const involvedTeam = ownTeams.find((team) =>
      team.id === challenge.challengerTeamId || team.id === challenge.challengedTeamId);
    if (!involvedTeam) {
      throw new ApiError(403, "CHALLENGE_FORBIDDEN", "Você não administra um time deste desafio.");
    }
    const courtChoices = form.querySelector("fieldset .grid");
    if (courtChoices) {
      replaceChildren(
        courtChoices,
        courts.content.length
          ? courts.content.map((court, index) => createElement("label", { className: "choice" }, [
              createElement("input", {
                attributes: {
                  type: "radio",
                  name: "courtId",
                  value: court.id,
                  checked: index === 0
                }
              }),
              createElement("span", { className: "flex-1" }, [
                createElement("strong", { className: "text-sm", text: court.name }),
                createElement("span", {
                  className: "help block mt-1",
                  text: `${court.neighborhood} · ${court.city}`
                })
              ])
            ]))
          : createElement("p", {
              className: "muted text-sm",
              text: "Salve uma quadra antes de fazer a proposta."
            })
      );
    }
    const dateInput = form.querySelector("#challenge-date");
    const timeSelect = form.querySelector("#challenge-time");
    const message = form.querySelector("#observation");
    if (dateInput) {
      dateInput.name = "date";
      dateInput.min = new Date().toISOString().slice(0, 10);
    }
    if (timeSelect) {
      timeSelect.name = "time";
      replaceChildren(timeSelect, ["10:00", "11:00", "18:00", "19:00", "20:00"].map((time) =>
        createElement("option", { attributes: { value: time }, text: `${time}–${addHour(time)}` })));
    }
    if (message) {
      message.name = "message";
      message.maxLength = 500;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const startsAt = toIsoDateTime(dateInput.value, timeSelect.value);
      if (!startsAt || !form.elements.courtId?.value) {
        showFormMessage(form, "Escolha uma quadra, data e horário.");
        return;
      }
      setFormBusy(form, true);
      try {
        await api.teams.propose(challengeId, {
          proposedByTeamId: involvedTeam.id,
          courtId: form.elements.courtId.value,
          startsAt,
          endsAt: addMinutes(startsAt, 60),
          message: message.value.trim() || null
        });
        navigate(`../chat-desafio/?challenge=${encodeURIComponent(challengeId)}`);
      } catch (error) {
        showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível enviar a proposta.");
      } finally {
        setFormBusy(form, false);
      }
    });
  } catch (error) {
    protectedError(error, main);
  }
}

function addHour(time) {
  const [hour, minute] = time.split(":").map(Number);
  return `${String((hour + 1) % 24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export async function initializeChallengeResponsePage() {
  const main = document.querySelector("main");
  const challengeId = getQueryParameter("challenge");
  if (!main || !challengeId) {
    return;
  }
  replaceChildren(main, createLoadingState("Carregando a proposta…"));
  try {
    const [challenge, proposals] = await Promise.all([
      api.teams.getChallenge(challengeId),
      api.teams.challengeProposals(challengeId)
    ]);
    const proposal = proposals.find((item) => item.status === "PENDING") || proposals[0];
    if (!proposal) {
      replaceChildren(main, createEmptyState("Nenhuma proposta ainda", "Conversem antes de escolher a quadra e o horário."));
      return;
    }
    const status = createElement("p", {
      className: "help mt-4",
      attributes: { role: "status", "aria-live": "polite" }
    });
    const accept = createElement("button", {
      className: "btn btn-primary",
      attributes: { type: "button" },
      text: "Aceitar proposta"
    });
    const change = createElement("a", {
      className: "btn btn-secondary",
      attributes: { href: `../propor-disputa/?challenge=${encodeURIComponent(challengeId)}` },
      text: "Sugerir alteração"
    });
    const decline = createElement("button", {
      className: "btn btn-danger",
      attributes: { type: "button" },
      text: "Recusar"
    });
    accept.addEventListener("click", async () => {
      accept.disabled = true;
      decline.disabled = true;
      try {
        await api.teams.respond(challengeId, {
          status: "ACCEPTED",
          proposalId: proposal.id
        });
        if (proposal.courtSlug) {
          navigate(`../quadra/?slug=${encodeURIComponent(proposal.courtSlug)}`);
        } else {
          navigate("../times/");
        }
      } catch (error) {
        status.textContent = error instanceof ApiError ? error.message : "Não foi possível aceitar a proposta.";
        accept.disabled = false;
        decline.disabled = false;
      }
    });
    decline.addEventListener("click", async () => {
      accept.disabled = true;
      decline.disabled = true;
      try {
        await api.teams.respond(challengeId, { status: "DECLINED", proposalId: null });
        navigate("../times/");
      } catch (error) {
        status.textContent = error instanceof ApiError ? error.message : "Não foi possível recusar o desafio.";
        accept.disabled = false;
        decline.disabled = false;
      }
    });
    replaceChildren(main, createElement("section", { className: "card p-7 max-w-2xl mx-auto" }, [
      createElement("span", { className: "badge badge-accent", text: "Proposta de amistoso" }),
      createElement("h1", {
        className: "title-lg mt-3",
        text: `${challenge.challengerTeamName} × ${challenge.challengedTeamName}`
      }),
      createElement("div", { className: "soft-panel mt-6" }, [
        createElement("p", {
          className: "eyebrow",
          text: proposal.courtName || "Quadra a definir"
        }),
        createElement("h2", {
          className: "title-md mt-1",
          text: formatDateTime(proposal.startsAt)
        }),
        createElement("p", { className: "muted text-sm mt-1", text: challenge.sport }),
        proposal.message
          ? createElement("p", { className: "text-sm mt-5", text: proposal.message })
          : null
      ].filter(Boolean)),
      createElement("div", { className: "flex flex-wrap gap-3 mt-7" }, [accept, change, decline]),
      status
    ]));
  } catch (error) {
    protectedError(error, main);
  }
}
