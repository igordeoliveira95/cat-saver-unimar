import "./style.css";
import { api } from "./api.js";
import { consumirAviso, esc } from "./util.js";
import { telaLogin } from "./telas/login.js";
import { telaGatos } from "./telas/gatos.js";
import { telaGatoForm } from "./telas/gatoForm.js";
import { telaAdocoes } from "./telas/adocoes.js";
import { telaNovaAdocao } from "./telas/novaAdocao.js";

const app = document.querySelector("#app");
const menu = document.querySelector("#menu");
let usuario = null;

const rotas = [
  { padrao: /^#\/gatos$/, tela: telaGatos, menu: "gatos" },
  { padrao: /^#\/gatos\/novo$/, tela: (el) => telaGatoForm(el), menu: "gatos" },
  { padrao: /^#\/gatos\/(\d+)$/, tela: (el, id) => telaGatoForm(el, id), menu: "gatos" },
  { padrao: /^#\/adocoes$/, tela: telaAdocoes, menu: "adocoes", perfil: "coordenador" },
  { padrao: /^#\/adocoes\/nova$/, tela: telaNovaAdocao, menu: "adocoes", perfil: "coordenador" },
];

function desenharMenu(ativo) {
  if (!usuario) {
    menu.hidden = true;
    return;
  }
  const coord = usuario.perfil === "coordenador";
  menu.hidden = false;
  menu.innerHTML = `
    <a class="marca" href="#/gatos">CatSaver</a>
    <button class="hamburguer" aria-expanded="false" aria-controls="links" aria-label="Abrir menu">☰</button>
    <div id="links" class="links">
      <a href="#/gatos" ${ativo === "gatos" ? 'aria-current="page"' : ""}>Gatos</a>
      ${coord ? `<a href="#/adocoes" ${ativo === "adocoes" ? 'aria-current="page"' : ""}>Adoções</a>` : ""}
      <span class="usuario">${esc(usuario.nome)} · ${coord ? "coordenador" : "voluntário"}</span>
      <button class="sair" type="button">Sair</button>
    </div>`;

  const botao = menu.querySelector(".hamburguer");
  botao.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    botao.setAttribute("aria-expanded", String(aberto));
  });
  menu.querySelector(".sair").addEventListener("click", async () => {
    await api("/auth/logout", { metodo: "POST" }).catch(() => {});
    usuario = null;
    location.hash = "#/login";
  });
}

async function navegar() {
  const hash = location.hash || "#/gatos";
  menu.classList.remove("aberto");

  if (!usuario) {
    desenharMenu();
    telaLogin(app, {
      aoEntrar: (u) => {
        usuario = u;
        if (location.hash === "#/gatos") void navegar();
        else location.hash = "#/gatos";
      },
    });
    return;
  }

  const rota = rotas.find((r) => r.padrao.test(hash));
  if (!rota || (rota.perfil && rota.perfil !== usuario.perfil)) {
    location.hash = "#/gatos";
    return;
  }

  desenharMenu(rota.menu);
  const [, parametro] = hash.match(rota.padrao);
  await rota.tela(app, parametro);

  const aviso = consumirAviso();
  if (aviso) {
    const el = document.createElement("p");
    el.className = "alerta sucesso flutuante";
    el.setAttribute("role", "status");
    el.textContent = `✓ ${aviso}`;
    app.prepend(el);
    setTimeout(() => el.remove(), 4000);
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", navegar);
window.addEventListener("sessao-expirada", () => {
  usuario = null;
  void navegar();
});

// Rodapé com o status da API (vem do PIE II, rota /api/health).
void api("/health")
  .then((d) => {
    document.querySelector("#status").textContent = `API: ${d.status}`;
  })
  .catch(() => {
    document.querySelector("#status").textContent = "API: fora do ar";
  });

// Se já existe sessão, entra direto.
void api("/auth/me")
  .then((u) => {
    usuario = u;
  })
  .catch(() => {})
  .finally(navegar);
