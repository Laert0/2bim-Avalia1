import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequestPost(context) {
  try {
    // --------------------------------------------------
    // 1. Verifica o método
    // --------------------------------------------------
    if (context.request.method !== "POST") {
      return new Response(
        JSON.stringify({ erro: "Método não permitido." }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // --------------------------------------------------
    // 2. Verifica o corpo da requisição
    // --------------------------------------------------
    let corpo;

    try {
      corpo = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({ erro: "Corpo JSON inválido." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    const numero = Number(corpo?.numero);

    if (!numeroValido(numero)) {
      return new Response(
        JSON.stringify({
          erro: "Número inválido. Informe um número inteiro entre 1 e 100."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // --------------------------------------------------
    // 3. Obtém o token do Google
    // --------------------------------------------------
    const autorizacao = context.request.headers.get("Authorization");

    if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          erro: "Token inválido ou ausente."
        }),
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
        JSON.stringify({
          erro: "Token inválido ou ausente."
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // --------------------------------------------------
    // 4. Verifica o Client ID configurado no Cloudflare
    // --------------------------------------------------
    const clientId = context.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return new Response(
        JSON.stringify({
          erro: "GOOGLE_CLIENT_ID não configurado no servidor."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // --------------------------------------------------
    // 5. Valida o ID Token diretamente com o Google
    // --------------------------------------------------
    const respostaGoogle = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        idToken
      )}`
    );

    if (!respostaGoogle.ok) {
      return new Response(
        JSON.stringify({
          erro: "Token inválido."
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    const verificacao = await respostaGoogle.json();

    // --------------------------------------------------
    // 6. Confere se o token pertence ao nosso Client ID
    // --------------------------------------------------
    if (verificacao.aud !== clientId) {
      return new Response(
        JSON.stringify({
          erro: "Token inválido."
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // --------------------------------------------------
    // 7. Confere o e-mail
    // --------------------------------------------------
    const email = verificacao.email;

    if (!email) {
      return new Response(
        JSON.stringify({
          erro: "E-mail não encontrado no token."
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // Aceita tanto true quanto "true"
    const emailVerificado =
      verificacao.email_verified === true ||
      verificacao.email_verified === "true";

    if (!emailVerificado) {
      return new Response(
        JSON.stringify({
          erro: "E-mail não verificado."
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // --------------------------------------------------
    // 8. Gera o desenho SVG
    // --------------------------------------------------
    const svg = gerarDesenho(numero, email);

    // --------------------------------------------------
    // 9. Retorna o SVG
    // --------------------------------------------------
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
        erro: "Erro interno ao gerar o desenho."
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
