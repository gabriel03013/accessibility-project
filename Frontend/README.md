# Frontend Partiu Quadra

Interface estática e responsiva para descoberta e aluguel de quadras privadas,
partidas abertas, checkout, conta do jogador e área do proprietário.

## Como abrir

Pelo Docker Compose, acesse `http://localhost:8088`. Para uma prévia apenas do
frontend, sirva esta pasta com qualquer servidor HTTP estático.

## Design system

A paleta principal segue o arquivo de design do projeto:

- verde principal: `#064e3b`;
- laranja de destaque: `#dc7048`;
- fundo claro: `#fbfaf6`;
- texto principal: `#17342b`;
- texto secundário: `#52665f`.

O CSS foi dividido para facilitar manutenção:

- `assets/css/tokens.css`: cores, temas e variáveis;
- `assets/css/base.css`: reset, tipografia e foco;
- `assets/css/components.css`: navegação, botões, cards e formulários;
- `assets/css/pages.css`: layouts específicos dos fluxos;
- `assets/css/responsive.css`: comportamento para tablet e celular;
- `assets/css/main.css`: ponto único de importação.

Tailwind CSS 2.2 é carregado por CDN para utilitários pontuais. As decisões de
identidade e acessibilidade permanecem no CSS próprio.

## JavaScript

Os módulos de interface são pequenos e independentes:

- `app.js`: inicialização;
- `navigation.js`: cabeçalho e navegação móvel;
- `preferences.js`: aparência e acessibilidade;
- `interactions.js`: feedbacks e interações simples;
- `dom.js`: utilitários de DOM;
- `api/`: cliente e serviços separados por domínio do backend.

O backend não foi alterado. A camada `api.js` mantém a fachada usada pelo
frontend e concentra qualquer adaptação futura aos contratos da API.

## Acessibilidade

- link “Pular para o conteúdo” em todas as páginas;
- foco visível e navegação completa por teclado;
- tema claro, escuro ou automático;
- contraste reforçado, texto maior e redução de movimento;
- HTML semântico, landmarks, títulos e nomes acessíveis;
- formulários com rótulos, ajuda e `autocomplete` apropriado;
- textos alternativos nas imagens e mensagens em região `aria-live`;
- layouts responsivos sem depender de interações por mouse.

As preferências são salvas localmente no navegador e podem ser abertas pelo
botão de acessibilidade no cabeçalho.
