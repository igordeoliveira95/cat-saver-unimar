# CatSaver

Sistema da CatSaver, uma ONG de Marília (SP) que resgata gatos abandonados, cuida deles e ajuda a encontrar um novo lar.

O sistema controla o cadastro dos gatos, dos adotantes e das adoções, e mostra com certeza quais gatos estão disponíveis e quem adotou cada um. O Documento de Visão (PIE I) está em [`docs/documento-de-visao.pdf`](docs/documento-de-visao.pdf).

Feito com [Vite+](https://viteplus.dev) e JavaScript puro no front, Express na API e MariaDB no banco.

## Requisitos

- Node.js 22 ou mais novo
- pnpm (ou Vite+ `vp`)
- Docker Desktop, para subir o MariaDB. Se você já tem MariaDB ou MySQL instalado, pode usar ele (veja abaixo).

## Como rodar

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/igordeoliveira95/cat-saver-unimar.git
   cd cat-saver-unimar
   pnpm install
   ```

2. Crie o arquivo `.env` a partir do exemplo e troque o `SESSION_SECRET`:

   ```bash
   cp .env.example .env
   ```

3. Suba o banco. Na primeira vez o Docker já roda `database/schema.sql` e `database/seed.sql`:

   ```bash
   docker compose up -d
   ```

   Sem Docker, com MariaDB/MySQL local: crie um usuário com os dados do `.env` e rode `SOURCE database/schema.sql;` e depois `SOURCE database/seed.sql;` no cliente do banco.

4. Em um terminal, suba a API:

   ```bash
   pnpm api
   ```

5. Em outro terminal, suba o front:

   ```bash
   pnpm dev
   ```

6. Abra http://localhost:5173 e entre com um dos usuários de demonstração.

### Usuários de demonstração

| Perfil      | E-mail                   | Senha       |
| ----------- | ------------------------ | ----------- |
| Coordenador | coordenacao@catsaver.org | catsaver123 |
| Voluntário  | voluntario@catsaver.org  | catsaver123 |

O coordenador vê tudo. O voluntário cadastra e edita gatos, mas não acessa adotantes nem adoções (LGPD, RNF03).

Para zerar o banco e voltar aos dados de demonstração: `docker compose down -v` e `docker compose up -d`.

## O que já funciona

- Login e logout com sessão (cookie httpOnly), senha com hash bcrypt e bloqueio de 15 minutos após 5 tentativas erradas
- Listagem de gatos com filtro por status e busca pelo nome, mostrando quem adotou cada gato
- Cadastro e edição de gatos, com validação das datas
- Busca de adotante pelo CPF e cadastro de adotante novo, com validação do CPF
- Registro de adoção com um ou mais gatos, numa única transação que muda o status para "adotado"
- Listagem de adoções com filtro por período
- Permissões por perfil na API e nas telas
- Layout responsivo, de 360 px até desktop

## Rotas da API

Todas as rotas, menos `/api/health` e `/api/auth/*`, exigem login. Rotas marcadas com (C) são só do coordenador.

| Método | Rota                            | Uso                                                                   |
| ------ | ------------------------------- | --------------------------------------------------------------------- |
| GET    | `/api/health`                   | Verifica se a API está no ar                                          |
| POST   | `/api/auth/login`               | Entrar (`{ email, senha }`)                                           |
| POST   | `/api/auth/logout`              | Sair                                                                  |
| GET    | `/api/auth/me`                  | Usuário da sessão atual                                               |
| GET    | `/api/gatos?status=&busca=`     | Listar gatos                                                          |
| GET    | `/api/gatos/:id`                | Ver um gato                                                           |
| POST   | `/api/gatos`                    | Cadastrar gato                                                        |
| PUT    | `/api/gatos/:id`                | Editar gato                                                           |
| GET    | `/api/adotantes?cpf=` (C)       | Buscar adotante pelo CPF                                              |
| POST   | `/api/adotantes` (C)            | Cadastrar adotante                                                    |
| GET    | `/api/adocoes?inicio=&fim=` (C) | Listar adoções por período                                            |
| POST   | `/api/adocoes` (C)              | Registrar adoção (`{ id_adotante, gatos, data_adocao, observacoes }`) |

## Estrutura

```
database/        schema.sql e seed.sql
server/          API Express (rotas, validação, sessão)
src/             front em JavaScript puro
  telas/         uma tela por arquivo
docs/            Documento de Visão do PIE I
```
