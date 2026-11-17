import { api } from "../api.js";
import { SEXO, STATUS, dataBr, esc, idadeAprox } from "../util.js";

// Tela 2 — Listagem de Gatos (RF03)
export async function telaGatos(app) {
  app.innerHTML = `
    <div class="topo-tela">
      <h1>Gatos</h1>
      <a class="btn primario so-desktop" href="#/gatos/novo">+ Novo gato</a>
    </div>
    <div class="filtros">
      <div class="campo">
        <label for="filtro-status">Status</label>
        <select id="filtro-status">
          <option value="">Todos</option>
          ${Object.entries(STATUS)
            .map(([v, t]) => `<option value="${v}">${t}</option>`)
            .join("")}
        </select>
      </div>
      <div class="campo crescer">
        <label for="filtro-busca">Buscar pelo nome</label>
        <input id="filtro-busca" type="search" placeholder="Ex.: Mingau" />
      </div>
    </div>
    <div id="lista" aria-live="polite"><p class="carregando">Carregando...</p></div>
    <a class="fab so-celular" href="#/gatos/novo" aria-label="Novo gato">+</a>`;

  const status = app.querySelector("#filtro-status");
  const busca = app.querySelector("#filtro-busca");
  const lista = app.querySelector("#lista");

  async function carregar() {
    const params = new URLSearchParams();
    if (status.value) params.set("status", status.value);
    if (busca.value.trim()) params.set("busca", busca.value.trim());

    try {
      const gatos = await api(`/gatos?${params}`);
      lista.innerHTML = gatos.length
        ? tabela(gatos)
        : `<p class="vazio">Nenhum gato encontrado.</p>`;
    } catch (err) {
      lista.innerHTML = `<p class="alerta erro">⚠ ${esc(err.message)}</p>`;
    }
  }

  let espera;
  busca.addEventListener("input", () => {
    clearTimeout(espera);
    espera = setTimeout(carregar, 250);
  });
  status.addEventListener("change", carregar);
  await carregar();
}

function tabela(gatos) {
  const linhas = gatos
    .map(
      (g) => `
      <tr>
        <td data-label="Nome"><strong>${esc(g.nome)}</strong></td>
        <td data-label="Sexo">${SEXO[g.sexo]}</td>
        <td data-label="Idade">${idadeAprox(g.data_nascimento_aprox)}</td>
        <td data-label="Resgate">${dataBr(g.data_resgate)}</td>
        <td data-label="Status">
          <span class="selo ${g.status}">${STATUS[g.status]}</span>
          ${g.adotante ? `<span class="adotante">com ${esc(g.adotante)}</span>` : ""}
        </td>
        <td data-label="Ações"><a class="btn secundario pequeno" href="#/gatos/${g.id_gato}">Editar</a></td>
      </tr>`,
    )
    .join("");

  return `
    <table class="tabela">
      <thead><tr><th>Nome</th><th>Sexo</th><th>Idade</th><th>Resgate</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <p class="contagem">${gatos.length} ${gatos.length === 1 ? "gato" : "gatos"}</p>`;
}
