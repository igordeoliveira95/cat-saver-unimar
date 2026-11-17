import { api } from "../api.js";
import { dataBr, esc } from "../util.js";

// Listagem de adoções por período (RF08)
export async function telaAdocoes(app) {
  app.innerHTML = `
    <div class="topo-tela">
      <h1>Adoções</h1>
      <a class="btn primario" href="#/adocoes/nova">+ Nova adoção</a>
    </div>
    <form class="filtros" id="filtro">
      <div class="campo"><label for="inicio">De</label><input id="inicio" name="inicio" type="date" /></div>
      <div class="campo"><label for="fim">Até</label><input id="fim" name="fim" type="date" /></div>
      <button class="btn secundario" type="submit">Filtrar</button>
    </form>
    <div id="lista" aria-live="polite"><p class="carregando">Carregando...</p></div>`;

  const form = app.querySelector("#filtro");
  const lista = app.querySelector("#lista");

  async function carregar() {
    const params = new URLSearchParams();
    if (form.inicio.value) params.set("inicio", form.inicio.value);
    if (form.fim.value) params.set("fim", form.fim.value);
    try {
      const adocoes = await api(`/adocoes?${params}`);
      lista.innerHTML = adocoes.length
        ? `<table class="tabela">
            <thead><tr><th>Data</th><th>Adotante</th><th>Gato(s)</th><th>Registrada por</th></tr></thead>
            <tbody>${adocoes
              .map(
                (a) => `<tr>
                  <td data-label="Data">${dataBr(a.data_adocao)}</td>
                  <td data-label="Adotante"><strong>${esc(a.adotante)}</strong></td>
                  <td data-label="Gato(s)">${esc(a.gatos)}</td>
                  <td data-label="Registrada por">${esc(a.registrado_por)}</td>
                </tr>`,
              )
              .join("")}</tbody>
          </table>`
        : `<p class="vazio">Nenhuma adoção no período.</p>`;
    } catch (err) {
      lista.innerHTML = `<p class="alerta erro">⚠ ${esc(err.message)}</p>`;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void carregar();
  });
  await carregar();
}
