import type { MetadadosPaginacao } from "@/shared/types/api.types";

export type EntradaPaginacao = {
  page?: number;

  limit?: number;
};

export type ParametrosPaginacao = {
  page: number;

  limit: number;

  skip: number;
};

const DEFAULT_PAGE = 1;

const DEFAULT_LIMIT = 10;

const MAX_LIMIT = 100;

export function resolverParametrosPaginacao(input: EntradaPaginacao): ParametrosPaginacao {
  const pagina = input.page && input.page > 0 ? input.page : DEFAULT_PAGE;

  const limite = input.limit && input.limit > 0 ? Math.min(input.limit, MAX_LIMIT) : DEFAULT_LIMIT;

  return {
    page: pagina,

    limit: limite,

    skip: (pagina - 1) * limite,
  };
}

export function montarMetadadosPaginacao(
  paginacao: ParametrosPaginacao,

  total: number,
): MetadadosPaginacao {
  return {
    page: paginacao.page,

    limit: paginacao.limit,

    total,

    totalPages: total === 0 ? 0 : Math.ceil(total / paginacao.limit),
  };
}
