import { mapearTipoApiParaBanco, montarFiltroPrisma } from "@/modules/questoes/dto/question.types";

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

  test("montarFiltroPrisma adiciona filtro de tipo mapeado para banco", () => {
    const resultado = montarFiltroPrisma({
      tipo: "MULTIPLA_ESCOLHA",
    });

    expect(resultado).toEqual({
      excluidoEm: null,
      status: "ATIVO",
      tipoQuestao: mapearTipoApiParaBanco("MULTIPLA_ESCOLHA"),
    });
  });

  test("montarFiltroPrisma combina todos os filtros", () => {
    const resultado = montarFiltroPrisma({
      tema: "histologia",
      dificuldade: "FACIL",
      tipo: "VERDADEIRO_FALSO",
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
      tipoQuestao: mapearTipoApiParaBanco("VERDADEIRO_FALSO"),
    });
  });
});
