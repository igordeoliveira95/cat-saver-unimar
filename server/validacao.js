// Funções de validação usadas pelas rotas.

export class ErroValidacao extends Error {
  constructor(campos, mensagem = "Confira os campos destacados.") {
    super(mensagem);
    this.status = 400;
    this.campos = campos;
  }
}

export class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// Data de hoje no fuso de Marília, no formato AAAA-MM-DD.
export function hoje() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function dataValida(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(valor);
}

export function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

export function soDigitos(valor) {
  return texto(valor).replace(/\D/g, "");
}

export function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(cpf.slice(0, 9)) === Number(cpf[9]) && digito(cpf.slice(0, 10)) === Number(cpf[10]);
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
