import { z } from "zod";

export const schemaPaginacaoConquistas = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const schemaDesbloqueioId = z.object({
  id: z.string().trim().min(1),
});

export const schemaAlterarDestaqueConquista = z.object({
  destaque: z.boolean(),
});
