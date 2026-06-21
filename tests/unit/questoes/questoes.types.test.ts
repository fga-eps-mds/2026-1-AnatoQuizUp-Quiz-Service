import {
  montarFiltroPrisma,
  converterParaRespostaQuestao,
} from "@/modules/questoes/dto/question.types";
import type { RegistroQuestaoCompleta } from "@/modules/questoes/dto/question.types";

function criarRegistroCompleto(
  overrides: Partial<RegistroQuestaoCompleta> = {},
): RegistroQuestaoCompleta {
  const agora = new Date("2026-05-09T12:00:00.000Z");
  return {
    id: "questao-1",
    enunciado: "Enunciado",
    tipoQuestao: "MULTIPLA_ESCOLHA",
    respostaCorreta: "A",
    saibaMais: "Explicacao",
    status: "ATIVO",
    urlImagem: null,
    taxonomiaBloom: "ANALISAR",
    origemQuestao: "PROVA_ANTERIOR",
    regiaoAnatomica: "Tórax",
    criadoPorId: "professor-1",
    temaId: "tema-1",
    questaoOriginalId: null,
    criadoEm: agora,
    atualizadoEm: agora,
    excluidoEm: null,
    dificuldade: "MEDIA",
    tema: {
      id: "tema-1",
      nome: "Anatomia",
      criadoEm: agora,
      atualizadoEm: agora,
      excluidoEm: null,
    },
    alternativas: {
      id: "alt-1",
      alternativaA: "A",
      alternativaB: "B",
      alternativaC: "C",
      alternativaD: "D",
      alternativaE: "E",
      questaoId: "questao-1",
      criadoEm: agora,
      atualizadoEm: agora,
      excluidoEm: null,
    },
    ...overrides,
  } as RegistroQuestaoCompleta;
}

describe("Testa Questoes Types", () => {
  test("montarFiltroPrisma retorna filtro base quando não há filtros", () => {
    const resultado = montarFiltroPrisma({});

    expect(resultado).toEqual({
      excluidoEm: null,
      status: "ATIVO",
    });
  });

  test("montarFiltroPrisma adiciona filtro de tema com contains insensitive", () => {
    const resultado = montarFiltroPrisma({
      tema: "anatomia",
    });

    expect(resultado).toEqual({
      excluidoEm: null,
      status: "ATIVO",
      tema: {
        nome: {
          contains: "anatomia",
          mode: "insensitive",
        },
      },
    });
  });

  test("montarFiltroPrisma adiciona filtro de dificuldade", () => {
    const resultado = montarFiltroPrisma({
      dificuldade: "DIFICIL",
    });

    expect(resultado).toEqual({
      excluidoEm: null,
      status: "ATIVO",
      dificuldade: "DIFICIL",
    });
  });

  test("montarFiltroPrisma adiciona filtro de tipo", () => {
    const resultado = montarFiltroPrisma({
      tipo: "MULTIPLA_ESCOLHA",
    });

    expect(resultado).toEqual({
      excluidoEm: null,
      status: "ATIVO",
      tipoQuestao: "MULTIPLA_ESCOLHA",
    });
  });

  test("montarFiltroPrisma adiciona filtro de taxonomiaBloom", () => {
    const resultado = montarFiltroPrisma({
      taxonomiaBloom: "LEMBRAR",
    });

    expect(resultado).toEqual({
      excluidoEm: null,
      status: "ATIVO",
      taxonomiaBloom: "LEMBRAR",
    });
  });

  test("converterParaRespostaQuestao propaga os campos de classificacao", () => {
    const resposta = converterParaRespostaQuestao(criarRegistroCompleto());

    expect(resposta).toMatchObject({
      taxonomiaBloom: "ANALISAR",
      origemQuestao: "PROVA_ANTERIOR",
      regiaoAnatomica: "Tórax",
    });
  });

  test("converterParaRespostaQuestao mantem null nos campos de classificacao ausentes", () => {
    const resposta = converterParaRespostaQuestao(
      criarRegistroCompleto({
        taxonomiaBloom: null,
        regiaoAnatomica: null,
      }),
    );

    expect(resposta.taxonomiaBloom).toBeNull();
    expect(resposta.regiaoAnatomica).toBeNull();
    // origemQuestao nunca é null (tem default no banco)
    expect(resposta.origemQuestao).toBe("PROVA_ANTERIOR");
  });

  test("montarFiltroPrisma combina todos os filtros", () => {
    const resultado = montarFiltroPrisma({
      tema: "histologia",
      dificuldade: "FACIL",
      tipo: "CERTO_ERRADO",
    });

    expect(resultado).toEqual({
      excluidoEm: null,
      status: "ATIVO",
      tema: {
        nome: {
          contains: "histologia",
          mode: "insensitive",
        },
      },
      dificuldade: "FACIL",
      tipoQuestao: "CERTO_ERRADO",
    });
  });
});
