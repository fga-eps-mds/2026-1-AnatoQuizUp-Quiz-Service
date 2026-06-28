import { z } from "zod";

// Schemas Zod do modulo de conquistas.

// Query de paginacao comum as listagens de conquistas.
export const schemaPaginacaoConquistas = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// Params: id da conquista/desbloqueio.
export const schemaDesbloqueioId = z.object({
  id: z.string().trim().min(1),
});

// Query de varios usuarios: ids por virgula, normalizados em array unico (1 a 100).
export const schemaUsuariosIds = z.object({
  usuarioIds: z
    .string()
    .transform((valor) => [
      ...new Set(
        valor
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string().min(1)).min(1).max(100)),
});

// Body para ligar/desligar o destaque de uma conquista.
export const schemaAlterarDestaqueConquista = z.object({
  destaque: z.boolean(),
});
