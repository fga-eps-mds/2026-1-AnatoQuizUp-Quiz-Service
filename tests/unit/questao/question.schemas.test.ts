import { schemaAtualizarQuestao, schemaCriarQuestao } from "../../../src/modules/questao/questao.schemas";

describe("schemas question", () => {
  test("valida criacao de questao de multipla escolha com 5 alternativas", () => {
    const resultado = schemaCriarQuestao.safeParse({
      tema: "Anatomia",
      enunciado: "Enunciado",
      tipo: "MULTIPLA_ESCOLHA",
      imagem: "https://cdn.example.com/imagem.png",
      alternativaCorreta: "A",
      dificuldade: "DIFICIL",
      explicacaoPedagogica: "Explicacao",
      alternativas: {
        A: "Alternativa A",
        B: "Alternativa B",
        C: "Alternativa C",
        D: "Alternativa D",
        E: "Alternativa E",
      },
    });

    expect(resultado.success).toBe(true);
  });

  test("rejeita multipla escolha sem as 5 alternativas", () => {
    const resultado = schemaCriarQuestao.safeParse({
      tema: "Anatomia",
      enunciado: "Enunciado",
      tipo: "MULTIPLA_ESCOLHA",
      dificuldade: "DIFICIL",
      imagem: "https://cdn.example.com/imagem.png",
      alternativaCorreta: "A",
      explicacaoPedagogica: "Explicacao",
      alternativas: {
        A: "Alternativa A",
      },
    });

    expect(resultado.success).toBe(false);
  });

  test("valida verdadeiro/falso apenas com gabarito C ou E", () => {
    const resultado = schemaCriarQuestao.safeParse({
      tema: "Histologia",
      enunciado: "Enunciado",
      tipo: "VERDADEIRO_FALSO",
      dificuldade: "DIFICIL",
      imagem: "https://cdn.example.com/histologia.png",
      alternativaCorreta: "E",
      explicacaoPedagogica: "Explicacao",
      alternativas: {
        C: "Verdadeiro",
        E: "Falso",
      },
    });

    expect(resultado.success).toBe(true);
  });

  test("rejeita verdadeiro/falso com gabarito fora de C ou E", () => {
    const resultado = schemaCriarQuestao.safeParse({
      tema: "Histologia",
      enunciado: "Enunciado",
      tipo: "VERDADEIRO_FALSO",
      dificuldade: "DIFICIL",
      imagem: "https://cdn.example.com/histologia.png",
      alternativaCorreta: "A",
      explicacaoPedagogica: "Explicacao",
      alternativas: {
        C: "Verdadeiro",
        E: "Falso",
      },
    });

    expect(resultado.success).toBe(false);
  });

  test("valida atualizacao parcial", () => {
    const resultado = schemaAtualizarQuestao.safeParse({
      enunciado: "Novo enunciado",
    });

    expect(resultado.success).toBe(true);
  });
});
