import { z } from 'zod';

export const schemaParamsDashboard = z.object({
  id: z.string({
    message: 'O ID da turma é obrigatório e deve ser um texto válido.',
  }).cuid({
    message: 'Formato de ID inválido.',
  }),
});

export const schemaParamsListaDashboard = z.object({
  id: z.string({
    message: 'O ID da turma é obrigatório.',
  }).cuid({
    message: 'Formato de ID da turma inválido.',
  }),
  listaId: z.string({
    message: 'O ID da lista é obrigatório.',
  }).cuid({
    message: 'Formato de ID da lista inválido.',
  }),
});