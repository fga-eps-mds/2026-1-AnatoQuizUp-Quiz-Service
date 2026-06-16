import { z } from "zod";

export const VALORES_TIPO_ITEM_AVATAR = [
  "CABELO",
  "ROUPA",
  "JALECO",
  "OCULOS",
  "ACESSORIO",
  "CALCADO",
  "OUTRO",
] as const;

export const VALORES_RARIDADE_ITEM_AVATAR = ["COMUM", "RARO", "EPICO", "LENDARIO"] as const;

export const schemaListarCatalogoAvatar = z.object({
  tipo: z.enum(VALORES_TIPO_ITEM_AVATAR).optional(),

  raridade: z.enum(VALORES_RARIDADE_ITEM_AVATAR).optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const schemaListarInventarioAvatar = z.object({
  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const schemaComprarItemAvatar = z.object({
  itemAvatarLojaId: z.string().trim().min(1, "ID do item de avatar e obrigatorio."),
});

export type ListarCatalogoAvatarQueryDto = z.infer<typeof schemaListarCatalogoAvatar>;

export type ListarInventarioAvatarQueryDto = z.infer<typeof schemaListarInventarioAvatar>;

export type ComprarItemAvatarDto = z.infer<typeof schemaComprarItemAvatar>;