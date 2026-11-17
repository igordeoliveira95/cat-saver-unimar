import { Router } from "express";
import { pool } from "../db.js";
import { ErroHttp, ErroValidacao, cpfValido, emailValido, soDigitos, texto } from "../validacao.js";

const router = Router();

const UFS =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const MORADIAS = ["casa", "apartamento", "outro"];

const CAMPOS = `id_adotante, nome, cpf, email, telefone, cep, rua, numero, bairro, cidade, uf,
                tipo_moradia, criado_em`;

// UC03 passo 1: busca pelo CPF.
router.get("/", async (req, res) => {
  const cpf = soDigitos(req.query.cpf);
  if (!cpfValido(cpf)) throw new ErroValidacao({ cpf: "CPF inválido" }, "CPF inválido.");

  const [linhas] = await pool.query(`SELECT ${CAMPOS} FROM adotante WHERE cpf = ?`, [cpf]);
  if (!linhas[0]) throw new ErroHttp(404, "CPF não encontrado.");
  res.json(linhas[0]);
});

// RF05 / UC03: cadastro de adotante.
router.post("/", async (req, res) => {
  const b = req.body ?? {};
  const a = {
    nome: texto(b.nome),
    cpf: soDigitos(b.cpf),
    email: texto(b.email).toLowerCase(),
    telefone: soDigitos(b.telefone),
    cep: soDigitos(b.cep) || null,
    rua: texto(b.rua),
    numero: texto(b.numero),
    bairro: texto(b.bairro),
    cidade: texto(b.cidade),
    uf: texto(b.uf).toUpperCase(),
    tipo_moradia: texto(b.tipo_moradia),
  };

  const campos = {};
  const obrigatorio = (campo, max) => {
    if (!a[campo]) campos[campo] = "Campo obrigatório";
    else if (a[campo].length > max) campos[campo] = `Use no máximo ${max} caracteres`;
  };

  obrigatorio("nome", 100);
  if (!cpfValido(a.cpf)) campos.cpf = "CPF inválido";
  if (!a.email) campos.email = "Campo obrigatório";
  else if (!emailValido(a.email) || a.email.length > 150) campos.email = "E-mail inválido";
  if (!a.telefone) campos.telefone = "Campo obrigatório";
  else if (a.telefone.length < 10 || a.telefone.length > 11)
    campos.telefone = "Telefone inválido (DDD + número)";
  if (a.cep && a.cep.length !== 8) campos.cep = "CEP deve ter 8 dígitos";
  obrigatorio("rua", 120);
  obrigatorio("numero", 10);
  obrigatorio("bairro", 80);
  obrigatorio("cidade", 80);
  if (!UFS.includes(a.uf)) campos.uf = "Selecione a UF";
  if (!MORADIAS.includes(a.tipo_moradia)) campos.tipo_moradia = "Selecione o tipo de moradia";

  if (Object.keys(campos).length) throw new ErroValidacao(campos);

  try {
    const [r] = await pool.query(
      `INSERT INTO adotante (nome, cpf, email, telefone, cep, rua, numero, bairro, cidade, uf, tipo_moradia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.nome,
        a.cpf,
        a.email,
        a.telefone,
        a.cep,
        a.rua,
        a.numero,
        a.bairro,
        a.cidade,
        a.uf,
        a.tipo_moradia,
      ],
    );
    const [linhas] = await pool.query(`SELECT ${CAMPOS} FROM adotante WHERE id_adotante = ?`, [
      r.insertId,
    ]);
    res.status(201).json(linhas[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      if (err.message.includes("email")) throw new ErroValidacao({ email: "E-mail já cadastrado" });
      throw new ErroValidacao({ cpf: "CPF já cadastrado" });
    }
    throw err;
  }
});

export default router;
