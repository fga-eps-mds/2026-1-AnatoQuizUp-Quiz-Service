import { z } from "zod";

// Schemas Zod da loja, mais os tipos inferidos usados pelo controller/service.

// Tipos de cosmeticos disponiveis no catalogo.
export const VALORES_TIPO_ITEM_LOJA = [
  "ICONE_PERFIL",
  "MOLDURA",
  "AVATAR",
  "TITULO",
  "PLANO_FUNDO",
] as const;

// Query do catalogo: filtro por tipo e paginacao.
export const schemaListarCatalogo = z.object({
  tipo: z.enum(VALORES_TIPO_ITEM_LOJA).optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// Query do inventario: apenas paginacao.
export const schemaListarInventario = z.object({
  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// Body da compra: id do item desejado.
export const schemaComprarItem = z.object({
  itemLojaId: z.string().trim().min(1, "ID do item e obrigatorio."),
});

// Tipos inferidos a partir dos schemas (fonte unica de verdade do formato).
export type ListarCatalogoQueryDto = z.infer<typeof schemaListarCatalogo>;

export type ListarInventarioQueryDto = z.infer<typeof schemaListarInventario>;

export type ComprarItemDto = z.infer<typeof schemaComprarItem>;
