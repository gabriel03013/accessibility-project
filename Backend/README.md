# Backend

API REST do Partiu Quadra em Spring Boot, Spring Security, JPA e PostgreSQL.

## Organização

- `controller`: endpoints HTTP;
- `dto`: contratos de entrada e saída;
- `model`: entidades e enums;
- `repository`: acesso ao PostgreSQL;
- `service`: regras de negócio;
- `security`: configuração do Spring Security;
- `config` e `exception`: configuração e erros da API.

## Domínios implementados

- cadastro, login, refresh, logout e perfil autenticado;
- tipos de conta `PLAYER` e `OWNER` definidos por enum;
- cadastro com fotos e estrutura, busca e favoritos de quadras;
- times, convites, desafios e contrapropostas;
- solicitações de aluguel, resposta do proprietário e reservas;
- pagamento local totalmente simulado;
- conversas de reservas e desafios.

## Endereços principais

| Método | Caminho | Acesso |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | público |
| `POST` | `/api/v1/auth/login` | público |
| `GET` | `/api/v1/courts` | público |
| `POST` | `/api/v1/courts` | proprietário |
| `POST` | `/api/v1/teams` | autenticado |
| `POST` | `/api/v1/rental-requests` | autenticado |
| `PATCH` | `/api/v1/rental-requests/{id}/accept` | proprietário |
| `POST` | `/api/v1/payments` | autenticado |
| `POST` | `/api/v1/conversations/{id}/messages` | participante |

Para pagar, envie somente o `reservationId`. Se a reserva pertencer ao usuário
e estiver aguardando pagamento, ela é confirmada imediatamente. Não há gateway,
Pix, cartão, token bancário ou cobrança real.

## Banco

O Flyway executa uma única migration em
`src/main/resources/db/migration/V1__schema.sql`. Como o histórico foi
consolidado, um banco criado pelas migrations antigas deve ser recriado antes
de usar esta versão.
