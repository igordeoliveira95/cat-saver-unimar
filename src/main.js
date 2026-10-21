import "./style.css";

const status = document.querySelector("#status");

fetch("/api/health")
  .then((res) => res.json())
  .then((data) => {
    const time = new Date(data.time).toLocaleString("pt-BR");
    status.textContent = `Status da API: ${data.status} (${time})`;
  })
  .catch(() => {
    status.textContent = "Status da API: fora do ar";
  });
