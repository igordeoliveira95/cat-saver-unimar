import { Router } from "express";
import { pool } from "../db.js";
import { ErroHttp, ErroValidacao, dataValida, hoje, texto } from "../validacao.js";

const router = Router();

const SELECT_ADOCAO = `
  SELECT ad.id_adocao, ad.data_adocao, ad.observacoes,
         a.id_adotante, a.nome AS adotante,
         u.nome AS registrado_por,
         GROUP_CONCAT(g.nome ORDER BY g.nome SEPARATOR ', ') AS gatos
    FROM adocao ad
    JOIN adotante a ON a.id_adotante = ad.id_adotante
    JOIN usuario u ON u.id_usuario = ad.id_usuario
    JOIN adocao_gato ag ON ag.id_adocao = ad.id_adocao
    JOIN gato g ON g.id_gato = ag.id_gato`;

// RF08: lista de adoções, com filtro opcional por período.
router.get("/", async (req, res) => {
  const filtros = [];
  const params = [];
  const inicio = texto(req.query.inicio);
  const fim = texto(req.query.fim);

  if (inicio) {
    if (!dataValida(inicio)) throw new ErroHttp(400, "Data inicial inválida.");
    filtros.push("ad.data_adocao >= ?");
    params.push(inicio);
  }
  if (fim) {
    if (!dataValida(fim)) throw new ErroHttp(400, "Data final inválida.");
    filtros.push("ad.data_adocao <= ?");
    params.push(fim);
  }

  const where = filtros.length ? ` WHERE ${filtros.join(" AND ")}` : "";
  const [linhas] = await pool.query(
    `${SELECT_ADOCAO}${where} GROUP BY ad.id_adocao ORDER BY ad.data_adocao DESC, ad.id_adocao DESC`,
    params,
  );
  res.json(linhas);
});

// RF06 / UC04: registra a adoção numa única transação.
router.post("/", async (req, res) => {
  const b = req.body ?? {};
  const idAdotante = Number(b.id_adotante);
  const ids = Array.isArray(b.gatos)
    ? [...new Set(b.gatos.map(Number))].filter(Number.isInteger)
    : [];
  const dataAdocao = texto(b.data_adocao);
  const observacoes = texto(b.observacoes) || null;

  const campos = {};
  if (!Number.isInteger(idAdotante) || idAdotante <= 0) campos.id_adotante = "Selecione o adotante";
  if (!ids.length) campos.gatos = "Selecione pelo menos um gato";
  if (!dataAdocao) campos.data_adocao = "Campo obrigatório";
  else if (!dataValida(dataAdocao)) campos.data_adocao = "Data inválida";
  else if (dataAdocao > hoje()) campos.data_adocao = "A data da adoção não pode ser futura";
  if (Object.keys(campos).length) throw new ErroValidacao(campos);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [adotante] = await conn.query("SELECT id_adotante FROM adotante WHERE id_adotante = ?", [
      idAdotante,
    ]);
    if (!adotante[0]) throw new ErroValidacao({ id_adotante: "Adotante não encontrado" });

    // Trava as linhas dos gatos para evitar que duas adoções peguem o mesmo gato (UC04, 8a).
    const [gatos] = await conn.query(
      "SELECT id_gato, nome, status FROM gato WHERE id_gato IN (?) FOR UPDATE",
      [ids],
    );
    if (gatos.length !== ids.length)
      throw new ErroValidacao({ gatos: "Algum gato selecionado não existe" });

    const indisponiveis = gatos.filter((g) => g.status !== "disponivel").map((g) => g.nome);
    if (indisponiveis.length) {
      throw new ErroValidacao(
        { gatos: `Não está mais disponível: ${indisponiveis.join(", ")}` },
        `Não está mais disponível: ${indisponiveis.join(", ")}.`,
      );
    }

    const [r] = await conn.query(
      "INSERT INTO adocao (id_adotante, id_usuario, data_adocao, observacoes) VALUES (?, ?, ?, ?)",
      [idAdotante, req.session.usuario.id, dataAdocao, observacoes],
    );
    await conn.query("INSERT INTO adocao_gato (id_adocao, id_gato) VALUES ?", [
      ids.map((id) => [r.insertId, id]),
    ]);
    await conn.query("UPDATE gato SET status = 'adotado' WHERE id_gato IN (?)", [ids]);

    await conn.commit();

    const [linhas] = await pool.query(
      `${SELECT_ADOCAO} WHERE ad.id_adocao = ? GROUP BY ad.id_adocao`,
      [r.insertId],
    );
    res.status(201).json(linhas[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

export default router;
