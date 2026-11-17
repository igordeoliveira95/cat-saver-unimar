import { Router } from "express";
import { pool } from "../db.js";
import { ErroHttp, ErroValidacao, dataValida, hoje, texto } from "../validacao.js";

const router = Router();

const SEXOS = ["macho", "femea"];
const STATUS = ["em_tratamento", "disponivel", "adotado"];

// Lista os gatos com o nome de quem adotou (adoção ativa = sem data de devolução).
const SELECT_GATO = `
  SELECT g.id_gato, g.nome, g.sexo, g.data_nascimento_aprox, g.pelagem, g.data_resgate,
         g.local_resgate, g.castrado, g.vacinado, g.status, g.observacoes, g.criado_em,
         u.nome AS cadastrado_por,
         (SELECT a.nome FROM adocao_gato ag
            JOIN adocao ad ON ad.id_adocao = ag.id_adocao
            JOIN adotante a ON a.id_adotante = ad.id_adotante
           WHERE ag.id_gato = g.id_gato AND ag.data_devolucao IS NULL
           LIMIT 1) AS adotante
    FROM gato g
    JOIN usuario u ON u.id_usuario = g.id_usuario`;

function formatar(g) {
  return { ...g, castrado: Boolean(g.castrado), vacinado: Boolean(g.vacinado) };
}

// Valida e normaliza o corpo do formulário de gato (UC02, fluxos 5a a 5c).
function lerGato(body = {}) {
  const g = {
    nome: texto(body.nome),
    sexo: texto(body.sexo),
    data_nascimento_aprox: texto(body.data_nascimento_aprox) || null,
    pelagem: texto(body.pelagem) || null,
    data_resgate: texto(body.data_resgate),
    local_resgate: texto(body.local_resgate),
    castrado: body.castrado === true,
    vacinado: body.vacinado === true,
    status: texto(body.status) || "em_tratamento",
    observacoes: texto(body.observacoes) || null,
  };

  const campos = {};
  if (!g.nome) campos.nome = "Campo obrigatório";
  else if (g.nome.length > 60) campos.nome = "Use no máximo 60 caracteres";

  if (!SEXOS.includes(g.sexo)) campos.sexo = "Campo obrigatório";

  if (!g.data_resgate) campos.data_resgate = "Campo obrigatório";
  else if (!dataValida(g.data_resgate)) campos.data_resgate = "Data inválida";
  else if (g.data_resgate > hoje()) campos.data_resgate = "A data do resgate não pode ser futura";

  if (g.data_nascimento_aprox) {
    if (!dataValida(g.data_nascimento_aprox)) campos.data_nascimento_aprox = "Data inválida";
    else if (dataValida(g.data_resgate) && g.data_nascimento_aprox > g.data_resgate)
      campos.data_nascimento_aprox = "A data de nascimento deve ser anterior ao resgate";
  }

  if (!g.local_resgate) campos.local_resgate = "Campo obrigatório";
  else if (g.local_resgate.length > 150) campos.local_resgate = "Use no máximo 150 caracteres";

  if (g.pelagem && g.pelagem.length > 40) campos.pelagem = "Use no máximo 40 caracteres";
  if (!STATUS.includes(g.status)) campos.status = "Status inválido";

  if (Object.keys(campos).length) throw new ErroValidacao(campos);
  return g;
}

// RF03: lista com filtro por status e busca pelo nome.
router.get("/", async (req, res) => {
  const filtros = [];
  const params = [];
  const status = texto(req.query.status);
  const busca = texto(req.query.busca);

  if (status) {
    if (!STATUS.includes(status)) throw new ErroHttp(400, "Status inválido.");
    filtros.push("g.status = ?");
    params.push(status);
  }
  if (busca) {
    filtros.push("g.nome LIKE ?");
    params.push(`%${busca}%`);
  }

  const where = filtros.length ? ` WHERE ${filtros.join(" AND ")}` : "";
  const [linhas] = await pool.query(
    `${SELECT_GATO}${where} ORDER BY g.criado_em DESC, g.id_gato DESC`,
    params,
  );
  res.json(linhas.map(formatar));
});

router.get("/:id", async (req, res) => {
  const [linhas] = await pool.query(`${SELECT_GATO} WHERE g.id_gato = ?`, [req.params.id]);
  if (!linhas[0]) throw new ErroHttp(404, "Gato não encontrado.");
  res.json(formatar(linhas[0]));
});

// RF02 / UC02: cadastro de gato.
router.post("/", async (req, res) => {
  const g = lerGato(req.body);
  if (g.status === "adotado") {
    throw new ErroValidacao({ status: "O status “adotado” é definido ao registrar a adoção" });
  }

  const [r] = await pool.query(
    `INSERT INTO gato (id_usuario, nome, sexo, data_nascimento_aprox, pelagem, data_resgate,
                       local_resgate, castrado, vacinado, status, observacoes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.session.usuario.id,
      g.nome,
      g.sexo,
      g.data_nascimento_aprox,
      g.pelagem,
      g.data_resgate,
      g.local_resgate,
      g.castrado,
      g.vacinado,
      g.status,
      g.observacoes,
    ],
  );

  const [linhas] = await pool.query(`${SELECT_GATO} WHERE g.id_gato = ?`, [r.insertId]);
  res.status(201).json(formatar(linhas[0]));
});

// RF04: edição de gato. O status "adotado" só entra e sai pelo fluxo de adoção.
router.put("/:id", async (req, res) => {
  const g = lerGato(req.body);
  const [atual] = await pool.query("SELECT status FROM gato WHERE id_gato = ?", [req.params.id]);
  if (!atual[0]) throw new ErroHttp(404, "Gato não encontrado.");

  const eraAdotado = atual[0].status === "adotado";
  if (eraAdotado && g.status !== "adotado") {
    throw new ErroValidacao({ status: "Gato adotado: o status só muda pela devolução" });
  }
  if (!eraAdotado && g.status === "adotado") {
    throw new ErroValidacao({ status: "O status “adotado” é definido ao registrar a adoção" });
  }

  await pool.query(
    `UPDATE gato SET nome = ?, sexo = ?, data_nascimento_aprox = ?, pelagem = ?, data_resgate = ?,
                     local_resgate = ?, castrado = ?, vacinado = ?, status = ?, observacoes = ?
      WHERE id_gato = ?`,
    [
      g.nome,
      g.sexo,
      g.data_nascimento_aprox,
      g.pelagem,
      g.data_resgate,
      g.local_resgate,
      g.castrado,
      g.vacinado,
      g.status,
      g.observacoes,
      req.params.id,
    ],
  );

  const [linhas] = await pool.query(`${SELECT_GATO} WHERE g.id_gato = ?`, [req.params.id]);
  res.json(formatar(linhas[0]));
});

export default router;
