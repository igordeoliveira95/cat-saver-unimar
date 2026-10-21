# CatSaver

Site da CatSaver, uma ONG que resgata gatos abandonados, cuida deles e ajuda a encontrar um novo lar.

Projeto feito com [Vite+](https://viteplus.dev) no front e Express na API.

## Requisitos

- Node.js 22 ou mais novo
- Vite+ (`vp`) ou pnpm

## Como rodar

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/igordeoliveira95/cat-saver-unimar.git
cd cat-saver-unimar
pnpm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Em um terminal, suba a API:

```bash
pnpm api
```

Em outro terminal, suba o front:

```bash
pnpm dev
```

Abra http://localhost:5173 no navegador. A página deve mostrar "Status da API: ok" com a data e a hora.

## Rotas da API

| Método | Rota          | Resposta                                   |
| ------ | ------------- | ------------------------------------------ |
| GET    | `/api/health` | `{ "status": "ok", "time": "<data ISO>" }` |
