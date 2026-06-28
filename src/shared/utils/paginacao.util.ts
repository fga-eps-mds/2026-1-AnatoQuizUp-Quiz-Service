import type { MetadadosPaginacao } from "@/shared/types/api.types";

// Utilitarios de paginacao compartilhados pelos repositories/services.

// Entrada crua de paginacao (pode vir incompleta da query).
export type EntradaPaginacao = {
  page?: number;

  limit?: number;
};

// Parametros normalizados, ja com o "skip" calculado para o Prisma.
export type ParametrosPaginacao = {
  page: number;

  limit: number;

  skip: number;
};

// Valores padrao e teto do limite por pagina.
const DEFAULT_PAGE = 1;

const DEFAULT_LIMIT = 10;

const MAX_LIMIT = 100;

// Normaliza page/limit (aplicando padroes e teto) e calcula o skip.
export function resolverParametrosPaginacao(input: EntradaPaginacao): ParametrosPaginacao {
  const pagina = input.page && input.page > 0 ? input.page : DEFAULT_PAGE;

  const limite = input.limit && input.limit > 0 ? Math.min(input.limit, MAX_LIMIT) : DEFAULT_LIMIT;

  return {
    page: pagina,

    limit: limite,

    skip: (pagina - 1) * limite,
  };
}

// Monta os metadados de paginacao da resposta (inclui o total de paginas).
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
