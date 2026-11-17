// Chamadas à API. Toda resposta de erro vira um ErroApi com a mensagem e os campos.

export class ErroApi extends Error {
  constructor(status, dados = {}) {
    super(dados.erro || "Não foi possível falar com o servidor.");
    this.status = status;
    this.campos = dados.campos || {};
  }
}

export async function api(caminho, { metodo = "GET", corpo } = {}) {
  let res;
  try {
    const opcoes = { method: metodo };
    if (corpo) {
      opcoes.headers = { "Content-Type": "application/json" };
      opcoes.body = JSON.stringify(corpo);
    }
    res = await fetch(`/api${caminho}`, opcoes);
  } catch {
    throw new ErroApi(0, { erro: "Sem conexão com o servidor. Verifique se a API está rodando." });
  }

  if (res.status === 204) return null;
  const dados = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Sessão expirou no meio do uso: avisa o app para voltar ao login.
    if (res.status === 401 && !caminho.startsWith("/auth/")) {
      window.dispatchEvent(new CustomEvent("sessao-expirada"));
    }
    throw new ErroApi(res.status, dados);
  }
  return dados;
}
