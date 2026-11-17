import "dotenv/config";
import express from "express";
import session from "express-session";
import { exigirLogin, exigirPerfil } from "./auth.js";
import authRoutes from "./routes/auth.js";
import gatosRoutes from "./routes/gatos.js";
import adotantesRoutes from "./routes/adotantes.js";
import adocoesRoutes from "./routes/adocoes.js";

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  console.warn("Aviso: SESSION_SECRET não definido no .env. Usando um valor de desenvolvimento.");
}

app.use(express.json());
app.use(
  session({
    name: "catsaver.sid",
    secret: process.env.SESSION_SECRET || "dev-catsaver",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 },
  }),
);

// Rotas públicas (RNF02): só health e login.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});
app.use("/api/auth", authRoutes);

// Daqui pra baixo, tudo exige sessão ativa.
app.use("/api", exigirLogin);
app.use("/api/gatos", gatosRoutes);
app.use("/api/adotantes", exigirPerfil("coordenador"), adotantesRoutes);
app.use("/api/adocoes", exigirPerfil("coordenador"), adocoesRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// Erros de validação viram 400 com os campos; o resto vira 500 sem expor detalhes.
app.use((err, req, res, _next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ erro: err.message, campos: err.campos });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno. Tente de novo em instantes." });
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
