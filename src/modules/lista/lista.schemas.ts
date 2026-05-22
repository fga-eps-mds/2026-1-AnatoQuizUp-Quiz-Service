import { z } from 'zod';

export const schemaParametroId = z.object({
  id: z.string().cuid('ID da lista inválido.'),
});

export const schemaEstatisticasParams = z.object({
  id: z.string().cuid('ID da lista inválido.'),
  turmaId: z.string().cuid('ID da turma inválido.'),
});

export const schemaParametroTurmaId = z.object({
  turmaId: z.string().cuid('ID da turma inválido.'),
});

export const schemaListarListas = z.object({
  busca: z.string().optional(),
  status: z.enum(['PUBLICADA', 'RASCUNHO']).optional(),
});
