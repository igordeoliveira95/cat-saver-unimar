// Funções pequenas usadas por várias telas.

export function esc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const STATUS = {
  em_tratamento: "Em tratamento",
  disponivel: "Disponível",
  adotado: "Adotado",
};

export const SEXO = { macho: "Macho", femea: "Fêmea" };

export function hojeIso() {
  return new Date().toLocaleDateString("en-CA");
}

export function dataBr(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function idadeAprox(iso) {
  if (!iso) return "—";
  const nasc = new Date(`${iso}T00:00:00`);
  const meses = Math.floor((Date.now() - nasc.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (meses < 1) return "~recém-nascido";
  if (meses < 12) return `~${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  return `~${anos} ${anos === 1 ? "ano" : "anos"}`;
}

export function formatarCpf(valor) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  let s = d.slice(0, 3);
  if (d.length > 3) s += `.${d.slice(3, 6)}`;
  if (d.length > 6) s += `.${d.slice(6, 9)}`;
  if (d.length > 9) s += `-${d.slice(9)}`;
  return s;
}

// Mensagem de sucesso que aparece na próxima tela renderizada.
let avisoPendente = null;
export function avisar(texto) {
  avisoPendente = texto;
}
export function consumirAviso() {
  const t = avisoPendente;
  avisoPendente = null;
  return t;
}

// Mostra os erros que vieram da API embaixo de cada campo do formulário.
export function mostrarErros(form, campos = {}) {
  form.querySelectorAll(".erro-campo").forEach((el) => el.remove());
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));

  let primeiro = null;
  for (const [nome, msg] of Object.entries(campos)) {
    const alvo =
      form.querySelector(`[name="${nome}"]`) || form.querySelector(`[data-campo="${nome}"]`);
    if (!alvo) continue;
    alvo.setAttribute("aria-invalid", "true");
    const p = document.createElement("p");
    p.className = "erro-campo";
    p.textContent = `⚠ ${msg}`;
    (alvo.closest(".campo") || alvo).append(p);
    primeiro ??= alvo;
  }
  primeiro?.focus?.();
}
