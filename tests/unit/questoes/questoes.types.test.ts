import { montarFiltroPrisma } from "@/modules/questoes/dto/question.types";

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
