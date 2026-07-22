# Histórico de auditorias Lighthouse

Este arquivo registra os resultados reproduzíveis de cada execução. Os scores
devem ser copiados do relatório gerado, sem estimativas ou arredondamentos
inventados.

## Como executar

1. Suba o ambiente completo com `docker compose up --build`.
2. Aguarde `http://localhost:8088` e a API ficarem saudáveis.
3. Execute o Lighthouse em janela anônima, sem extensões, nas páginas abaixo.
4. Registre data, commit, URL, modo, scores e observações.

```bash
npx lighthouse http://localhost:8088/pages/inicio/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=html \
  --output-path=./lighthouse-inicio.html
```

## Execuções

| Data e hora (BRT) | Commit | URL | Modo | Performance | Acessibilidade | Boas práticas | SEO | Observações |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| 24/07/2026 09:31 | `N/D` | `/pages/inicio/` | Mobile | 62 | 100 | 96 | 100 | Servidor estático local; API indisponível; estado de erro avaliado. [Relatório HTML](output/lighthouse/lighthouse-inicio-2026-07-24.html) |
| 24/07/2026 09:32 | `N/D` | `/pages/buscar/` | Mobile | 64 | 100 | 96 | 90 | Servidor estático local; API indisponível; estado de erro avaliado. [Relatório HTML](output/lighthouse/lighthouse-buscar-2026-07-24.html) |
| 24/07/2026 09:32 | `N/D` | `/pages/quadra/?slug=auditoria` | Mobile | 63 | 100 | 96 | 90 | Servidor estático local; slug de auditoria; estado de erro avaliado. [Relatório HTML](output/lighthouse/lighthouse-quadra-2026-07-24.html) |

## Critério de aceite

- Nenhuma execução é considerada evidência enquanto houver `-` nos scores.
- Toda correção relevante deve gerar uma nova linha, preservando o histórico.
- O relatório HTML pode ser anexado à entrega, mas esta tabela é a evidência
  resumida obrigatória no repositório.
- Antes do pitch, repita as três execuções com a API e os dados semeados ativos;
  preserve estas medições como linha de base.
