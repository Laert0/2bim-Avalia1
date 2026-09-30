const GOOGLE_CLIENT_ID = "718627771735-mh3kmg16c2cff8punhqamhhbej03ncoj.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");
const usuario = document.getElementById("usuario");

let idToken = "";
let svgAtual = "";

function mostrarMensagem(texto) {
  mensagem.textContent = texto;
}

window.handleCredentialResponse = function (response) {
  idToken = response.credential;

  try {
    const payload = JSON.parse(
      atob(
        idToken
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    usuario.textContent =
      `Conectado como ${payload.email || "conta Google"}.`;
  } catch {
    usuario.textContent = "Login com Google realizado.";
  }

  mostrarMensagem("");
};

window.onload = function () {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("google-login"),
    {
      theme: "outline",
      size: "large",
      text: "signin_with"
    }
  );
};

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  mostrarMensagem("");

  const numero = Number(campoNumero.value);

  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mostrarMensagem("Digite um inteiro entre 1 e 100.");
    return;
  }

  if (!idToken) {
    mostrarMensagem("Faça login com Google antes de desenhar.");
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },

      body: JSON.stringify({
        numero: numero
      })
    });

    const texto = await resposta.text();

    if (resposta.status === 400) {
      mostrarMensagem(texto || "Requisição inválida.");
      return;
    }

    if (resposta.status === 401) {
      mostrarMensagem(texto || "Não autorizado.");
      return;
    }

    if (!resposta.ok) {
      mostrarMensagem("Erro ao gerar o desenho.");
      return;
    }

    svgAtual = texto;

    area.innerHTML = svgAtual;

    botaoBaixar.hidden = false;

  } catch (erro) {
    mostrarMensagem(
      "Não foi possível comunicar com o servidor."
    );
  }
});

botaoBaixar.addEventListener("click", () => {

  const arquivo = new Blob(
    [svgAtual],
    { type: "image/svg+xml" }
  );

  const url = URL.createObjectURL(arquivo);

  const link = document.createElement("a");

  link.href = url;
  link.download = "exemplo.svg";

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
});
