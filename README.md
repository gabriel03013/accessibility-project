# Partiu Quadra

Plataforma web para encontrar quadras esportivas, organizar times, solicitar
reservas e acompanhar pagamentos e conversas entre jogadores e proprietários.

## Stack

- Frontend: HTML semântico, JavaScript modular, CSS próprio e Tailwind CSS 2.2.
- Backend: Java 17, Spring Boot, Spring Security, JPA e Flyway.
- Banco de dados: PostgreSQL 17.
- Ambiente local: Docker Compose e Nginx.

O Tailwind é carregado por CDN para acelerar a composição responsiva deste
protótipo acadêmico. Ele não substitui as decisões de acessibilidade: landmarks,
ordem de títulos, nomes acessíveis, foco, contraste, estados e mensagens são
implementados e revisados no HTML, no CSS próprio e no JavaScript.

## Como executar

1. Copie `.env.example` para `.env`.
2. Substitua os valores de exemplo por segredos fortes e locais.
3. Execute `docker compose up --build`.
4. Em outro terminal, execute `./scripts/load-test-data.sh` se quiser preencher o banco.
5. Acesse `http://localhost:8088`.

```bash
cp .env.example .env
docker compose up --build
./scripts/load-test-data.sh
docker compose down
```

A API fica em `http://localhost:8080/api` e o endpoint de saúde em
`http://localhost:8080/actuator/health`. O PostgreSQL fica disponível somente
na rede privada do Compose. O pagamento é totalmente simulado: nenhum dado bancário é
solicitado e o clique em pagar confirma a reserva imediatamente.

## Dados de teste

O loader em `scripts/load-test-data.sh` aguarda o PostgreSQL ficar pronto e pode
ser executado novamente sem duplicar os dados. As reservas e solicitações usam
datas futuras calculadas no momento da carga.

- Jogador: `gabriel.player@teste.local`
- Proprietário: `rafael.owner@teste.local`
- Senha para todas as contas: `teste123456`

## Estrutura

- `frontend/`: páginas, estilos e módulos JavaScript acessíveis.
- `backend/`: API REST, regras de negócio, segurança, migrações e testes.
- `scripts/`: carga idempotente de dados para desenvolvimento e apresentação.
- `output/pdf/`: roteiro de uma página para o pitch.
- `lighthouse-report.md`: histórico datado das auditorias Lighthouse.
- `PROJECT-BOARD.md`: quadro de tarefas versionado da entrega.
- `compose.yaml`: frontend, API e PostgreSQL.

## Integrantes e funções

- Gabriel M. Gonçalves: desenvolvimento full stack, acessibilidade, testes e
  documentação.

## Uso de inteligência artificial

Ferramentas de IA generativa apoiaram:

- revisão da arquitetura e dos contratos entre frontend e API;
- sugestões de HTML semântico, mensagens de estado e critérios de
  acessibilidade;
- geração e revisão de trechos de código, testes e documentação;
- organização do roteiro do pitch e da lista de verificação da entrega.

Todo conteúdo apoiado por IA foi revisado, adaptado e validado pelo integrante.
As decisões técnicas, a integração final e a responsabilidade pela entrega são
humanas. Nenhum segredo real ou dado pessoal foi fornecido às ferramentas.

## Evidências e entrega

- [Histórico Lighthouse](lighthouse-report.md)
- [Board de tarefas](PROJECT-BOARD.md)
- [Roteiro do pitch](output/pdf/roteiro-pitch-partiu-quadra.pdf)
- [Documentação do frontend](frontend/README.md)
- [Documentação do backend](backend/README.md)

Antes da apresentação, no repositório Git completo, marque o commit aprovado:

```bash
git tag -a v1.0-pitch -m "Versão apresentada no pitch"
git push origin v1.0-pitch
```

> A tag precisa ser criada no repositório Git original. Uma cópia `.zip` sem a
> pasta `.git` não contém histórico suficiente para criar ou comprovar tags.
