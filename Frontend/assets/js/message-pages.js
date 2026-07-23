import { ApiError, api, getSession } from "./api.js?v=20260727-9";
import {
  createElement,
  createEmptyState,
  createLoadingState,
  getQueryParameter,
  loginPath,
  navigate,
  replaceChildren,
  setFormBusy,
  showFormMessage
} from "./dom.js?v=20260727-9";
import {
  formatDateTime,
  formatMessageDateTime,
  initials
} from "./format.js?v=20260727-9";

function handleError(error, container) {
  if (error instanceof ApiError && error.status === 401) {
    navigate(loginPath());
    return;
  }
  replaceChildren(container, createEmptyState(
    "Não foi possível carregar",
    error instanceof ApiError ? error.message : "Tente novamente em instantes."
  ));
}

function conversationPath(conversation) {
  const page = conversation.type === "TEAM_CHALLENGE" ? "chat-desafio" : "chat";
  const parameters = new URLSearchParams({
    conversation: conversation.id
  });
  if (new URLSearchParams(window.location.search).get("mode") === "owner") {
    parameters.set("mode", "owner");
  }
  return `../${page}/?${parameters.toString()}`;
}

function conversationLink(conversation, selectedId) {
  return createElement("a", {
    className: "conversation",
    attributes: {
      href: conversationPath(conversation),
      "aria-current": conversation.id === selectedId ? "page" : null
    }
  }, [
    createElement("span", {
      className: conversation.type === "TEAM_CHALLENGE"
        ? "brand-symbol brand-symbol-accent"
        : "avatar",
      text: initials(conversation.title)
    }),
    createElement("span", {}, [
      createElement("strong", { className: "text-sm", text: conversation.title }),
      createElement("span", {
        className: "help block mt-1",
        text: conversation.type === "TEAM_CHALLENGE" ? "Desafio entre times" : "Reserva de quadra"
      })
    ]),
    createElement("span", { className: "conversation-meta" }, [
      createElement("span", {
        className: "help",
        text: formatDateTime(conversation.createdAt)
      }),
      conversation.unread
        ? createElement("span", {
            className: "unread-dot",
            attributes: {
              "aria-label": "Nova mensagem"
            }
          })
        : null
    ].filter(Boolean))
  ]);
}

async function loadConversations(selectedId) {
  const page = await api.messages.list();
  return page.content.map((conversation) => conversationLink(conversation, selectedId));
}

export async function initializeMessagesPage() {
  const list = document.querySelector(".chat-list");
  if (!list) {
    return;
  }
  replaceChildren(list, createLoadingState("Carregando conversas…"));
  const refresh = async (showErrors) => {
    try {
      const links = await loadConversations();
      replaceChildren(
        list,
        links.length
          ? links
          : createEmptyState("Nenhuma conversa", "As conversas de reservas e desafios aparecerão aqui.")
      );
    } catch (error) {
      if (showErrors) {
        handleError(error, list);
      }
    }
  };
  await refresh(true);
  const poll = window.setInterval(() => {
    if (document.visibilityState === "visible" && !list.contains(document.activeElement)) {
      refresh(false);
    }
  }, 5000);
  window.addEventListener("beforeunload", () => window.clearInterval(poll), { once: true });
}

async function resolveConversation() {
  const conversationId = getQueryParameter("conversation");
  if (conversationId) {
    return conversationId;
  }
  const requestId = getQueryParameter("request");
  if (requestId) {
    const conversation = await api.messages.forRequest(requestId);
    return conversation.id;
  }
  const challengeId = getQueryParameter("challenge");
  if (challengeId) {
    const conversation = await api.messages.forChallenge(challengeId);
    return conversation.id;
  }
  return null;
}

function messageBubble(message, userId) {
  const own = message.senderId === userId;
  return createElement("div", {
    className: `bubble ${own ? "bubble-out" : "bubble-in"}`,
    dataset: { messageId: message.id }
  }, [
    own ? null : createElement("strong", {
      className: "block text-xs mb-1",
      text: message.senderName
    }),
    createElement("p", { text: message.body }),
    createElement("span", {
      className: "message-time block text-xs mt-2",
      text: formatMessageDateTime(message.sentAt)
    })
  ].filter(Boolean));
}

export async function initializeChatPage() {
  const main = document.querySelector("main");
  if (!main) {
    return;
  }
  replaceChildren(main, createLoadingState("Abrindo conversa…"));
  try {
    const conversationId = await resolveConversation();
    if (!conversationId) {
      replaceChildren(main, createEmptyState("Conversa não informada", "Abra uma conversa pela página de mensagens."));
      return;
    }
    const [conversationPage, sidebarLinks] = await Promise.all([
      api.messages.get(conversationId),
      loadConversations(conversationId)
    ]);
    const session = getSession();
    const messagesContainer = createElement("div", {
      className: "chat-messages",
      attributes: {
        role: "log",
        "aria-live": "polite",
        "aria-relevant": "additions"
      }
    });
    const seen = new Set();
    const appendMessages = (messages) => {
      for (const message of [...messages].reverse()) {
        if (!seen.has(message.id)) {
          seen.add(message.id);
          messagesContainer.append(messageBubble(message, session?.user?.id));
        }
      }
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    appendMessages(conversationPage.content);

    const form = createElement("form", { className: "chat-compose" }, [
      createElement("label", {
        className: "sr-only",
        attributes: { for: "chat-message" },
        text: "Mensagem"
      }),
      createElement("input", {
        className: "field",
        attributes: {
          id: "chat-message",
          name: "message",
          type: "text",
          maxlength: "4000",
          autocomplete: "off",
          placeholder: "Escreva uma mensagem",
          required: true
        }
      }),
      createElement("button", {
        className: "btn btn-primary",
        attributes: {
          type: "submit",
          "aria-label": "Enviar mensagem"
        }
      }, createElement("i", {
        className: "fa-regular fa-paper-plane",
        attributes: { "aria-hidden": "true" }
      }))
    ]);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = form.elements.message;
      const body = input.value.trim();
      if (!body) {
        return;
      }
      setFormBusy(form, true);
      try {
        const message = await api.messages.send(conversationId, body);
        input.value = "";
        appendMessages([message]);
        input.focus();
      } catch (error) {
        showFormMessage(form, error instanceof ApiError ? error.message : "Não foi possível enviar a mensagem.");
      } finally {
        setFormBusy(form, false);
      }
    });

    const layout = createElement("section", {
      className: "chat-layout",
      attributes: { "aria-label": "Conversa" }
    }, [
      createElement("aside", { className: "chat-list" }, sidebarLinks),
      createElement("div", { className: "chat-main" }, [
        createElement("div", { className: "p-4 divider" }, [
          createElement("strong", { text: "Conversa" }),
          createElement("p", { className: "help mt-1", text: "Mensagens visíveis apenas para participantes." })
        ]),
        messagesContainer,
        form
      ])
    ]);
    replaceChildren(main, layout);
    main.className = "page";

    const poll = window.setInterval(async () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      try {
        const page = await api.messages.get(conversationId);
        appendMessages(page.content);
      } catch {
      }
    }, 5000);
    window.addEventListener("beforeunload", () => window.clearInterval(poll), { once: true });
  } catch (error) {
    handleError(error, main);
  }
}
