import { api } from "../api.js";

// Tela 1 — Login (UC01)
export function telaLogin(app, { aoEntrar }) {
  app.innerHTML = `
    <section class="login">
      <h1 class="marca">CatSaver</h1>
      <p class="sub">Gestão de resgates e adoções</p>
      <form id="form-login" class="cartao" novalidate>
        <div class="campo">
          <label for="email">E-mail *</label>
          <input id="email" name="email" type="email" autocomplete="username" required />
        </div>
        <div class="campo">
          <label for="senha">Senha *</label>
          <input id="senha" name="senha" type="password" autocomplete="current-password" required />
        </div>
        <p class="alerta erro" id="erro-login" role="alert" hidden></p>
        <button type="submit" class="btn primario largo">Entrar</button>
        <p class="dica">Esqueceu a senha? Fale com a coordenação.</p>
      </form>
    </section>`;

  const form = app.querySelector("#form-login");
  const erro = app.querySelector("#erro-login");
  form.email.focus();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erro.hidden = true;
    const email = form.email.value.trim();
    const senha = form.senha.value;

    if (!email || !senha) {
      erro.textContent = "⚠ Preencha o e-mail e a senha";
      erro.hidden = false;
      (email ? form.senha : form.email).focus();
      return;
    }

    const botao = form.querySelector("button");
    botao.disabled = true;
    try {
      const usuario = await api("/auth/login", { metodo: "POST", corpo: { email, senha } });
      aoEntrar(usuario);
    } catch (err) {
      erro.textContent = `⚠ ${err.message}`;
      erro.hidden = false;
      form.senha.value = "";
      form.senha.focus();
    } finally {
      botao.disabled = false;
    }
  });
}
