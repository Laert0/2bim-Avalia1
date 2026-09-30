import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

function resposta(
  texto,
  status,
  contentType = "text/plain; charset=utf-8"
) {
  return new Response(texto, {
    status,
    headers: {
      "Content-Type": contentType
    }
  });
}

export async function onRequest({ request, env }) {

  // Método obrigatório: POST
  if (request.method !== "POST") {
    return resposta("Método não permitido.", 405);
  }

  // Lê o JSON enviado pelo navegador
  let dados;

  try {
    dados = await request.json();
  } catch {
    return resposta("Corpo JSON inválido.", 400);
  }

  // Valida o número
  if (!dados || !numeroValido(dados.numero)) {
    return resposta(
      "O campo numero deve ser um inteiro entre 1 e 100.",
      400
    );
  }

  // Verifica o Authorization Bearer
  const autorizacao =
    request.headers.get("Authorization") || "";

  if (!autorizacao.startsWith("Bearer ")) {
    return resposta("Token ausente ou inválido.", 401);
  }

  const token = autorizacao
    .slice(7)
    .trim();

  if (!token) {
    return resposta("Token ausente ou inválido.", 401);
  }

  // Client ID configurado no Cloudflare
  if (!env.GOOGLE_CLIENT_ID) {
    return resposta(
      "Configuração do servidor ausente.",
      500
    );
  }

  // Verifica o ID Token diretamente com o Google
  let verificacao;

  try {

    const respostaGoogle = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
      encodeURIComponent(token)
    );

    if (!respostaGoogle.ok) {
      return resposta(
        "Token inválido ou expirado.",
        401
      );
    }

    verificacao = await respostaGoogle.json();

  } catch {
    return resposta(
      "Não foi possível verificar o token.",
      401
    );
  }

  // Confere Client ID e e-mail verificado
  if (
    verificacao.aud !== env.GOOGLE_CLIENT_ID ||
    verificacao.email_verified !== "true" ||
    !verificacao.email
  ) {
    return resposta(
      "Token inválido ou e-mail não verificado.",
      401
    );
  }

  // Gera o desenho assinado com o e-mail autenticado
  const svg = gerarDesenho(
    dados.numero,
    verificacao.email
  );

  // Retorna o SVG
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
