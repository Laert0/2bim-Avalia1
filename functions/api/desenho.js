
import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequestPost(context) {
  try {
    // 1. Verifica o corpo da requisicao
    let corpo;

    try {
      corpo = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({ erro: "Corpo JSON invalido." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // 2. Valida o numero informado
    const numero = Number(corpo?.numero);

    if (!numeroValido(numero)) {
      return new Response(
        JSON.stringify({
          erro: "Numero invalido. Informe um numero inteiro entre 1 e 100."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // 3. Verifica o token de autenticacao do Google
    const autorizacao = context.request.headers.get("Authorization");

    if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ erro: "Token do Google ausente. Faca login novamente." }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    const idToken = autorizacao.substring("Bearer ".length).trim();

    if (!idToken) {
      return new Response(
        JSON.stringify({ erro: "Token do Google invalido." }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // 4. Obtem o Client ID do Google
    // O Client ID e publico; o valor abaixo e uma alternativa
    // caso a variavel nao esteja configurada no Cloudflare.
    const clientId =
      context.env?.GOOGLE_CLIENT_ID ||
      "718627771735-mh3kmg16c2cff8punhqamhhbej03ncoj.apps.googleusercontent.com";

    // 5. Valida o token com o Google
    const respostaGoogle = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!respostaGoogle.ok) {
      return new Response(
        JSON.stringify({ erro: "Token do Google invalido ou expirado. Faca login novamente." }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    const verificacao = await respostaGoogle.json();

    // 6. Confere se o token pertence ao Client ID esperado
    if (verificacao.aud !== clientId) {
      return new Response(
        JSON.stringify({ erro: "O login do Google nao corresponde ao Client ID configurado." }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // 7. Confere o e-mail e sua verificacao
    const email = verificacao.email;

    if (!email) {
      return new Response(
        JSON.stringify({ erro: "E-mail nao encontrado no token do Google." }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    const emailVerificado =
      verificacao.email_verified === true ||
      verificacao.email_verified === "true";

    if (!emailVerificado) {
      return new Response(
        JSON.stringify({ erro: "O e-mail da conta Google nao foi verificado." }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // 8. Gera o desenho
    const svg = gerarDesenho(numero, email);

    // 9. Retorna o desenho para o navegador
    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });

  } catch (erro) {
    console.error("Erro na API /api/desenho:", erro);

    return new Response(
      JSON.stringify({
        erro: "Erro interno ao gerar o desenho. Verifique os logs do Cloudflare."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        }
      }
    );
  }
}
