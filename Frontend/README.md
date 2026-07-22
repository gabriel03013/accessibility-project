# Partiu Quadra — frontend estático

Frontend responsivo em HTML, CSS e JavaScript modular, com Tailwind via CDN,
Font Awesome e tipografia Plus Jakarta Sans. Os dados são carregados pela API
e renderizados com criação explícita de elementos e `textContent`.

O Tailwind via CDN foi escolhido para reduzir o setup do protótipo e manter
consistência responsiva entre as telas. A acessibilidade continua sob controle
do projeto: o CSS próprio define foco e contraste, enquanto o HTML e o
JavaScript mantêm semântica, nomes acessíveis e estados explícitos.

Abra `index.html` ou comece por `pages/inicio/index.html`. Para usar os fluxos
com dados, suba o ambiente completo pelo Compose na raiz do projeto.

## Fluxos disponíveis

- Início, busca e detalhe da quadra
- Solicitação de reserva antes do pagamento
- Aprovação, recusa e sugestão de novo horário pelo proprietário
- Pagamento por Pix ou cartão e confirmação
- Times multiesporte, convites por nome de usuário e membros
- Convites detalhados com descrição, nível, rotina e administração do time
- Busca de adversários e desafios negociados entre administradores pelo chat
- Proposta de quadra e horário para disputas entre times
- Chat entre jogador e proprietário
- Lista de quadras salvas para agendar depois
- Login, cadastro, perfil e histórico de reservas
- Painel do proprietário, agenda, solicitações e anúncios
- Cadastro seguro de fotos e itens de estrutura da quadra

## Acessibilidade incluída

- Landmark regions, títulos e ordem de cabeçalhos coerentes
- Link para pular à área principal
- Foco visível e controles com rótulos associados
- Textos auxiliares ligados aos campos
- Alternativas textuais em imagens e ícones decorativos ocultos de leitores de tela
- Contraste alto e informações de status não dependentes apenas de cor
- Navegação inferior específica para celular
- Suporte a redução de movimento
- Estados de carregamento, lista vazia e erro em regiões dinâmicas

## Segurança no navegador

- Nenhuma renderização usa `innerHTML`
- Dados da API entram na interface como texto
- URLs de mídia passam por validação de protocolo
- Redirecionamentos aceitam apenas caminhos internos conhecidos
- Refresh token fica em cookie `HttpOnly` com `SameSite=Strict`
- Access token fica somente na sessão da aba
- A política de conteúdo permite scripts apenas da própria origem
