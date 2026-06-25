import { z } from 'zod';

export const schemaPontuacoesQuery = z.object({
  usuarioIds: z
    .string()
    .optional()
    .transform((valor) =>
      valor
        ? valor
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : [],
    ),
});

export type PontuacoesQuery = z.infer<typeof schemaPontuacoesQuery>;
