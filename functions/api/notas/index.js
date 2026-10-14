
function resposta(dados, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      return resposta({ erro: "Banco D1 não configurado." }, 500);
    }

    const resultado = await env.DB
      .prepare("SELECT id, aluno, nota, data_criacao FROM notas ORDER BY id DESC")
      .all();

    return resposta({ notas: resultado.results ?? [] });
  } catch (erro) {
    console.error("Erro ao consultar notas:", erro);
    return resposta({ erro: "Não foi possível consultar as notas." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return resposta({ erro: "Banco D1 não configurado." }, 500);
    }

    let corpo;

    try {
      corpo = await request.json();
    } catch {
      return resposta({ erro: "Envie um JSON válido." }, 400);
    }

    const aluno = typeof corpo?.aluno === "string"
      ? corpo.aluno.trim()
      : "";

    const nota = Number(corpo?.nota);

    if (!aluno || aluno.length > 150) {
      return resposta({
        erro: "Informe o nome do aluno, com até 150 caracteres."
      }, 400);
    }

    if (
      corpo?.nota === null ||
      corpo?.nota === undefined ||
      corpo?.nota === "" ||
      !Number.isFinite(nota) ||
      nota < 0 ||
      nota > 10
    ) {
      return resposta({
        erro: "A nota deve ser um número entre 0 e 10."
      }, 400);
    }

    const resultado = await env.DB
      .prepare(
        "INSERT INTO notas (aluno, nota, data_criacao) VALUES (?, ?, ?)"
      )
      .bind(aluno, nota, new Date().toISOString())
      .run();

    return resposta({
      mensagem: "Nota cadastrada com sucesso.",
      id: resultado.meta?.last_row_id
    }, 201);
  } catch (erro) {
    console.error("Erro ao cadastrar nota:", erro);
    return resposta({ erro: "Não foi possível cadastrar a nota." }, 500);
  }
}
