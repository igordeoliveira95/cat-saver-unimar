import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { texto } from "../validacao.js";

const router = Router();

// Controle de tentativas (RNF02): 5 erros em 15 minutos bloqueiam o e-mail por 15 minutos.
const JANELA_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS = 5;
const tentativas = new Map();

function bloqueadoAte(email) {
  const t = tentativas.get(email);
  if (t?.bloqueadoAte && t.bloqueadoAte > Date.now()) return t.bloqueadoAte;
  return null;
}

function registrarErro(email) {
  const agora = Date.now();
  let t = tentativas.get(email);
  if (!t || agora - t.inicio > JANELA_MS) t = { inicio: agora, erros: 0, bloqueadoAte: null };
  t.erros += 1;
  if (t.erros >= MAX_TENTATIVAS) t.bloqueadoAte = agora + JANELA_MS;
  tentativas.set(email, t);
  return t;
}

router.post("/login", async (req, res) => {
  const email = texto(req.body?.email).toLowerCase();
  const senha = typeof req.body?.senha === "string" ? req.body.senha : "";

  if (!email || !senha) {
    return res.status(400).json({ erro: "Preencha o e-mail e a senha." });
  }

  if (bloqueadoAte(email)) {
    return res
      .status(429)
      .json({ erro: "Muitas tentativas erradas. Tente de novo em 15 minutos." });
  }

  const [linhas] = await pool.query(
    "SELECT id_usuario, nome, email, senha_hash, perfil, ativo FROM usuario WHERE email = ?",
    [email],
  );
  const usuario = linhas[0];
  const senhaOk = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;

  if (!senhaOk) {
    const t = registrarErro(email);
    if (t.bloqueadoAte) {
      return res
        .status(429)
        .json({ erro: "Muitas tentativas erradas. Tente de novo em 15 minutos." });
    }
    return res.status(401).json({ erro: "E-mail ou senha incorretos." });
  }

  if (!usuario.ativo) {
    return res.status(403).json({ erro: "Acesso desativado. Procure a coordenação." });
  }

  tentativas.delete(email);
  const dados = {
    id: usuario.id_usuario,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ erro: "Não foi possível iniciar a sessão." });
    req.session.usuario = dados;
    res.json(dados);
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("catsaver.sid");
    res.status(204).end();
  });
});

router.get("/me", (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ erro: "Sem sessão ativa." });
  res.json(req.session.usuario);
});

export default router;
