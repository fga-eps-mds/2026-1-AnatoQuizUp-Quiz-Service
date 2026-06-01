import { z } from 'zod';

export const schemaParamsDashboard = z.object({
  id: z.string({
    message: 'O ID da turma é obrigatório e deve ser um texto válido.',
  }).cuid({
    message: 'Formato de ID inválido.',
  }),
});