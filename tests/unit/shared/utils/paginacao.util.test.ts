import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";

describe("paginacao.util", () => {
  it("usa valores padrao para entrada vazia ou invalida", () => {
    expect(resolverParametrosPaginacao({})).toEqual({
      page: 1,

      limit: 10,

      skip: 0,
    });

    expect(resolverParametrosPaginacao({ page: 0, limit: -1 })).toEqual({
      page: 1,

      limit: 10,

      skip: 0,
    });
  });

  it("limita tamanho maximo e calcula skip", () => {
    expect(resolverParametrosPaginacao({ page: 3, limit: 150 })).toEqual({
      page: 3,

      limit: 100,

      skip: 200,
    });
  });

  it("monta metadados de paginacao com total de paginas", () => {
    expect(
      montarMetadadosPaginacao(
        {
          page: 2,

          limit: 10,

          skip: 10,
        },

        21,
      ),
    ).toEqual({
      page: 2,

      limit: 10,

      total: 21,

      totalPages: 3,
    });
  });

  it("retorna zero paginas quando nao ha registros", () => {
    expect(
      montarMetadadosPaginacao(
        {
          page: 1,

          limit: 10,

          skip: 0,
        },

        0,
      ),
    ).toEqual({
      page: 1,

      limit: 10,

      total: 0,

      totalPages: 0,
    });
  });
});
