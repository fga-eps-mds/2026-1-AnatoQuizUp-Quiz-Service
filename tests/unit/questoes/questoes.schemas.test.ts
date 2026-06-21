import {
  schemaAtualizarQuestao,
  schemaCriarQuestao,
  schemaFiltrarQuestoes,
} from "../../../src/modules/questoes/questoes.schemas";

describe("schemas question", () => {
  test("valida criacao de questao de multipla escolha com 5 alternativas", () => {
    const resultado = schemaCriarQuestao.safeParse({
      tema: "Anatomia",
      enunciado: "Enunciado",
      tipo: "MULTIPLA_ESCOLHA",
      imagem: "https://cdn.example.com/imagem.png",
      alternativaCorreta: "A",
      dificuldade: "DIFICIL",
      saibaMais: "Explicacao",
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
      saibaMais: "Explicacao",
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
      tipo: "CERTO_ERRADO",
      dificuldade: "DIFICIL",
      imagem: "https://cdn.example.com/histologia.png",
      alternativaCorreta: "E",
      saibaMais: "Explicacao",
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
      tipo: "CERTO_ERRADO",
      dificuldade: "DIFICIL",
      imagem: "https://cdn.example.com/histologia.png",
      alternativaCorreta: "A",
      saibaMais: "Explicacao",
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

  test("aceita criacao com os campos de classificacao pedagogica e anatomica", () => {
    const resultado = schemaCriarQuestao.safeParse({
      tema: "Anatomia",
      enunciado: "Enunciado",
      tipo: "MULTIPLA_ESCOLHA",
      imagem: "https://cdn.example.com/imagem.png",
      alternativaCorreta: "A",
      dificuldade: "DIFICIL",
      saibaMais: "Explicacao",
      taxonomiaBloom: "ANALISAR",
      origemQuestao: "PROVA_ANTERIOR",
      regiaoAnatomica: "Tórax",
      alternativas: { A: "A", B: "B", C: "C", D: "D", E: "E" },
    });

    expect(resultado.success).toBe(true);
  });

  test("rejeita taxonomiaBloom fora do enum", () => {
    const resultado = schemaCriarQuestao.safeParse({
      tema: "Anatomia",
      enunciado: "Enunciado",
      tipo: "MULTIPLA_ESCOLHA",
      imagem: "https://cdn.example.com/imagem.png",
      alternativaCorreta: "A",
      dificuldade: "DIFICIL",
      saibaMais: "Explicacao",
      taxonomiaBloom: "MEMORIZAR",
      alternativas: { A: "A", B: "B", C: "C", D: "D", E: "E" },
    });

    expect(resultado.success).toBe(false);
  });

  test("schemaFiltrarQuestoes aceita taxonomiaBloom valido", () => {
    const resultado = schemaFiltrarQuestoes.safeParse({ taxonomiaBloom: "LEMBRAR" });

    expect(resultado.success).toBe(true);
  });

  test("schemaFiltrarQuestoes rejeita taxonomiaBloom invalido", () => {
    const resultado = schemaFiltrarQuestoes.safeParse({ taxonomiaBloom: "FOO" });

    expect(resultado.success).toBe(false);
  });
});
