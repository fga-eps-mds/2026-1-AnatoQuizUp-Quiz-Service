import { z } from "zod";

export const VALORES_TIPO_ITEM_LOJA = [
  "ICONE_PERFIL",
  "MOLDURA",
  "AVATAR",
  "TITULO",
  "PLANO_FUNDO",
] as const;

export const schemaListarCatalogo = z.object({
  tipo: z.enum(VALORES_TIPO_ITEM_LOJA).optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const schemaListarInventario = z.object({
  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const schemaComprarItem = z.object({
  itemLojaId: z.string().trim().min(1, "ID do item e obrigatorio."),
});

export type ListarCatalogoQueryDto = z.infer<typeof schemaListarCatalogo>;

export type ListarInventarioQueryDto = z.infer<typeof schemaListarInventario>;

export type ComprarItemDto = z.infer<typeof schemaComprarItem>;
