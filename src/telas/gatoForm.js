import { api } from "../api.js";
import { avisar, esc, hojeIso, mostrarErros } from "../util.js";

// Tela 3 — Cadastro (UC02) e edição (RF04) de gato
export async function telaGatoForm(app, id) {
  let gato = {
    nome: "",
    sexo: "",
    data_nascimento_aprox: "",
    pelagem: "",
    data_resgate: "",
    local_resgate: "",
    castrado: false,
    vacinado: false,
    status: "em_tratamento",
    observacoes: "",
  };

  if (id) {
    app.innerHTML = `<p class="carregando">Carregando...</p>`;
    try {
      gato = await api(`/gatos/${id}`);
    } catch (err) {
      app.innerHTML = `<p class="alerta erro">⚠ ${esc(err.message)}</p><a href="#/gatos">Voltar</a>`;
      return;
    }
  }

  const adotado = gato.status === "adotado";
  const titulo = id ? `Editar ${esc(gato.nome)}` : "Novo gato";
  const opcao = (valor, texto, atual) =>
    `<option value="${valor}" ${valor === atual ? "selected" : ""}>${texto}</option>`;

  app.innerHTML = `
    <nav class="trilha"><a href="#/gatos">Gatos</a> › ${id ? "Editar" : "Novo gato"}</nav>
    <h1>${titulo}</h1>
    <form id="form-gato" class="cartao grade" novalidate>
      <div class="campo">
        <label for="nome">Nome *</label>
        <input id="nome" name="nome" maxlength="60" value="${esc(gato.nome)}" required />
      </div>
      <div class="campo">
        <label for="sexo">Sexo *</label>
        <select id="sexo" name="sexo" required>
          <option value="">Selecione</option>
          ${opcao("macho", "Macho", gato.sexo)}
          ${opcao("femea", "Fêmea", gato.sexo)}
        </select>
      </div>
      <div class="campo">
        <label for="data_nascimento_aprox">Data de nascimento aproximada</label>
        <input id="data_nascimento_aprox" name="data_nascimento_aprox" type="date" max="${hojeIso()}"
               value="${esc(gato.data_nascimento_aprox || "")}" />
      </div>
      <div class="campo">
        <label for="pelagem">Pelagem</label>
        <input id="pelagem" name="pelagem" maxlength="40" placeholder="Ex.: preto, frajola, tricolor"
               value="${esc(gato.pelagem || "")}" />
      </div>
      <div class="campo">
        <label for="data_resgate">Data do resgate *</label>
        <input id="data_resgate" name="data_resgate" type="date" max="${hojeIso()}"
               value="${esc(gato.data_resgate)}" required />
      </div>
      <div class="campo">
        <label for="local_resgate">Local do resgate *</label>
        <input id="local_resgate" name="local_resgate" maxlength="150" placeholder="Bairro ou referência"
               value="${esc(gato.local_resgate)}" required />
      </div>
      <div class="campo checks">
        <label class="check"><input type="checkbox" name="castrado" ${gato.castrado ? "checked" : ""} /> Castrado</label>
        <label class="check"><input type="checkbox" name="vacinado" ${gato.vacinado ? "checked" : ""} /> Vacinado</label>
      </div>
      <div class="campo">
        <label for="status">Status *</label>
        <select id="status" name="status" ${adotado ? "disabled" : ""}>
          ${
            adotado
              ? opcao("adotado", "Adotado", "adotado")
              : opcao("em_tratamento", "Em tratamento", gato.status) +
                opcao("disponivel", "Disponível", gato.status)
          }
        </select>
        ${adotado ? `<p class="dica">Adotado por ${esc(gato.adotante || "—")}. O status muda só pela devolução.</p>` : ""}
      </div>
      <div class="campo inteiro">
        <label for="observacoes">Observações</label>
        <textarea id="observacoes" name="observacoes" rows="3"
                  placeholder="Temperamento, cuidados especiais...">${esc(gato.observacoes || "")}</textarea>
      </div>
      <p class="alerta erro inteiro" id="erro-form" role="alert" hidden></p>
      <div class="acoes inteiro">
        <a class="btn secundario" href="#/gatos">Cancelar</a>
        <button type="submit" class="btn primario">Salvar</button>
      </div>
    </form>`;

  const form = app.querySelector("#form-gato");
  const erro = app.querySelector("#erro-form");
  form.nome.focus();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erro.hidden = true;

    const corpo = {
      nome: form.nome.value,
      sexo: form.sexo.value,
      data_nascimento_aprox: form.data_nascimento_aprox.value,
      pelagem: form.pelagem.value,
      data_resgate: form.data_resgate.value,
      local_resgate: form.local_resgate.value,
      castrado: form.castrado.checked,
      vacinado: form.vacinado.checked,
      status: form.status.value,
      observacoes: form.observacoes.value,
    };

    const botao = form.querySelector("button[type=submit]");
    botao.disabled = true;
    try {
      await api(id ? `/gatos/${id}` : "/gatos", { metodo: id ? "PUT" : "POST", corpo });
      avisar(id ? "Gato atualizado com sucesso" : "Gato cadastrado com sucesso");
      location.hash = "#/gatos";
    } catch (err) {
      mostrarErros(form, err.campos);
      if (!Object.keys(err.campos).length) {
        erro.textContent = `⚠ ${err.message}`;
        erro.hidden = false;
      }
    } finally {
      botao.disabled = false;
    }
  });
}
