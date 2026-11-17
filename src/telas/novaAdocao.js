import { api } from "../api.js";
import { SEXO, dataBr, esc, formatarCpf, hojeIso, idadeAprox, mostrarErros } from "../util.js";

const UFS =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

// Tela 4 — Nova Adoção (UC03 e UC04)
export async function telaNovaAdocao(app) {
  let adotante = null;
  let gatosDisponiveis = [];

  app.innerHTML = `
    <nav class="trilha"><a href="#/adocoes">Adoções</a> › Nova adoção</nav>
    <h1>Nova adoção</h1>

    <section class="cartao" aria-labelledby="passo1">
      <h2 id="passo1">1. Adotante</h2>
      <form id="form-cpf" class="linha" novalidate>
        <div class="campo crescer">
          <label for="cpf-busca">CPF *</label>
          <input id="cpf-busca" name="cpf" inputmode="numeric" placeholder="000.000.000-00" maxlength="14" />
        </div>
        <button type="submit" class="btn secundario">Buscar</button>
      </form>
      <div id="adotante"></div>
    </section>

    <section class="cartao" aria-labelledby="passo2">
      <h2 id="passo2">2. Gatos (somente disponíveis)</h2>
      <div id="gatos" data-campo="gatos"><p class="carregando">Carregando...</p></div>
    </section>

    <section class="cartao" aria-labelledby="passo3">
      <h2 id="passo3">3. Dados da adoção</h2>
      <form id="form-adocao" class="grade" novalidate>
        <div class="campo">
          <label for="data_adocao">Data da adoção *</label>
          <input id="data_adocao" name="data_adocao" type="date" max="${hojeIso()}" value="${hojeIso()}" />
        </div>
        <div class="campo inteiro">
          <label for="observacoes">Observações</label>
          <textarea id="observacoes" name="observacoes" rows="2"></textarea>
        </div>
        <p class="alerta erro inteiro" id="erro-adocao" role="alert" hidden></p>
        <div class="acoes inteiro">
          <a class="btn secundario" href="#/adocoes">Cancelar</a>
          <button type="submit" class="btn primario" id="registrar" disabled>Registrar adoção</button>
        </div>
      </form>
    </section>
    <div id="resultado"></div>`;

  const formCpf = app.querySelector("#form-cpf");
  const caixaAdotante = app.querySelector("#adotante");
  const caixaGatos = app.querySelector("#gatos");
  const formAdocao = app.querySelector("#form-adocao");
  const botaoRegistrar = app.querySelector("#registrar");
  const erroAdocao = app.querySelector("#erro-adocao");

  formCpf.cpf.addEventListener("input", (e) => {
    e.target.value = formatarCpf(e.target.value);
  });
  formCpf.cpf.focus();

  function atualizarBotao() {
    const marcados = caixaGatos.querySelectorAll("input:checked").length;
    botaoRegistrar.disabled = !adotante || marcados === 0;
  }

  function mostrarAdotante() {
    caixaAdotante.innerHTML = `
      <div class="selecionado">
        <p><strong>${esc(adotante.nome)}</strong> · CPF ${formatarCpf(adotante.cpf)}</p>
        <p>${esc(adotante.email)} · ${esc(adotante.telefone)}</p>
        <p>${esc(adotante.rua)}, ${esc(adotante.numero)} · ${esc(adotante.bairro)} · ${esc(adotante.cidade)}/${esc(adotante.uf)} · ${esc(adotante.tipo_moradia)}</p>
        <button type="button" class="btn secundario pequeno" id="trocar">Trocar adotante</button>
      </div>`;
    formCpf.hidden = true;
    caixaAdotante.querySelector("#trocar").addEventListener("click", () => {
      adotante = null;
      caixaAdotante.innerHTML = "";
      formCpf.hidden = false;
      formCpf.cpf.value = "";
      formCpf.cpf.focus();
      atualizarBotao();
    });
    atualizarBotao();
  }

  function mostrarNovoAdotante(cpf) {
    caixaAdotante.innerHTML = `
      <p class="alerta info">CPF não encontrado. Preencha o novo adotante:</p>
      <form id="form-adotante" class="grade" novalidate>
        <div class="campo"><label for="a-cpf">CPF *</label>
          <input id="a-cpf" name="cpf" value="${formatarCpf(cpf)}" readonly /></div>
        <div class="campo"><label for="a-nome">Nome *</label>
          <input id="a-nome" name="nome" maxlength="100" /></div>
        <div class="campo"><label for="a-email">E-mail *</label>
          <input id="a-email" name="email" type="email" maxlength="150" /></div>
        <div class="campo"><label for="a-telefone">Telefone *</label>
          <input id="a-telefone" name="telefone" type="tel" placeholder="(14) 99999-9999" /></div>
        <div class="campo"><label for="a-cep">CEP</label>
          <input id="a-cep" name="cep" inputmode="numeric" maxlength="9" /></div>
        <div class="campo"><label for="a-rua">Rua *</label>
          <input id="a-rua" name="rua" maxlength="120" /></div>
        <div class="campo"><label for="a-numero">Nº *</label>
          <input id="a-numero" name="numero" maxlength="10" placeholder="ou s/n" /></div>
        <div class="campo"><label for="a-bairro">Bairro *</label>
          <input id="a-bairro" name="bairro" maxlength="80" /></div>
        <div class="campo"><label for="a-cidade">Cidade *</label>
          <input id="a-cidade" name="cidade" maxlength="80" value="Marília" /></div>
        <div class="campo"><label for="a-uf">UF *</label>
          <select id="a-uf" name="uf">${UFS.map((u) => `<option ${u === "SP" ? "selected" : ""}>${u}</option>`).join("")}</select></div>
        <div class="campo"><label for="a-moradia">Moradia *</label>
          <select id="a-moradia" name="tipo_moradia">
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="outro">Outro</option>
          </select></div>
        <div class="acoes inteiro"><button type="submit" class="btn primario">Salvar adotante</button></div>
      </form>`;

    const form = caixaAdotante.querySelector("#form-adotante");
    form.nome.focus();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const corpo = Object.fromEntries(new FormData(form));
      try {
        adotante = await api("/adotantes", { metodo: "POST", corpo });
        mostrarAdotante();
        caixaAdotante.insertAdjacentHTML(
          "afterbegin",
          `<p class="alerta sucesso">✓ Adotante cadastrado</p>`,
        );
      } catch (err) {
        mostrarErros(form, err.campos);
      }
    });
  }

  formCpf.addEventListener("submit", async (e) => {
    e.preventDefault();
    mostrarErros(formCpf, {});
    const cpf = formCpf.cpf.value.replace(/\D/g, "");
    try {
      adotante = await api(`/adotantes?cpf=${cpf}`);
      mostrarAdotante();
    } catch (err) {
      if (err.status === 404) mostrarNovoAdotante(cpf);
      else mostrarErros(formCpf, { cpf: err.message.replace(/\.$/, "") });
    }
  });

  async function carregarGatos() {
    try {
      gatosDisponiveis = await api("/gatos?status=disponivel");
    } catch (err) {
      caixaGatos.innerHTML = `<p class="alerta erro">⚠ ${esc(err.message)}</p>`;
      return;
    }
    caixaGatos.innerHTML = gatosDisponiveis.length
      ? `<div class="lista-gatos">${gatosDisponiveis
          .map(
            (g) => `
            <label class="check gato">
              <input type="checkbox" value="${g.id_gato}" />
              <span><strong>${esc(g.nome)}</strong> · ${SEXO[g.sexo].toLowerCase()} · ${idadeAprox(g.data_nascimento_aprox)}</span>
            </label>`,
          )
          .join("")}</div>`
      : `<p class="vazio">Não há gatos disponíveis para adoção.</p>`;
    atualizarBotao();
  }
  caixaGatos.addEventListener("change", atualizarBotao);

  formAdocao.addEventListener("submit", async (e) => {
    e.preventDefault();
    erroAdocao.hidden = true;
    mostrarErros(app, {});
    const gatos = [...caixaGatos.querySelectorAll("input:checked")].map((i) => Number(i.value));

    botaoRegistrar.disabled = true;
    try {
      const adocao = await api("/adocoes", {
        metodo: "POST",
        corpo: {
          id_adotante: adotante?.id_adotante,
          gatos,
          data_adocao: formAdocao.data_adocao.value,
          observacoes: formAdocao.observacoes.value,
        },
      });
      app.innerHTML = `
        <div class="cartao resumo">
          <p class="alerta sucesso">✓ Adoção registrada</p>
          <p><strong>Adotante:</strong> ${esc(adocao.adotante)}</p>
          <p><strong>Gatos:</strong> ${esc(adocao.gatos)}</p>
          <p><strong>Data:</strong> ${dataBr(adocao.data_adocao)}</p>
          <div class="acoes">
            <a class="btn secundario" href="#/adocoes">Ver adoções</a>
            <button type="button" class="btn primario" id="outra">Nova adoção</button>
          </div>
        </div>`;
      app.querySelector("#outra").addEventListener("click", () => telaNovaAdocao(app));
    } catch (err) {
      // UC04 8a: algum gato deixou de estar disponível. Recarrega a lista.
      if (err.campos.gatos) await carregarGatos();
      mostrarErros(app, err.campos);
      erroAdocao.textContent = `⚠ ${err.message}`;
      erroAdocao.hidden = false;
      atualizarBotao();
    }
  });

  await carregarGatos();
}
