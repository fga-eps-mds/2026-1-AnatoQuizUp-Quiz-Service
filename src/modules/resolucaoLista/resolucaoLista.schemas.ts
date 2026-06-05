import { z } from 'zod';
import { AlternativaQuestao } from '@prisma/client';

export const schemaListarListas = z.object({
  status: z.enum(['PENDENTE', 'RESPONDIDA', 'EXPIRADA']).optional(),
  busca: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),
});

export const schemaBuscarListaPorId = z.object({
  id: z.string().cuid({ message: "ID da lista inválido" }),
});

export const schemaSubmeterLista = z.object({
  id: z.string().cuid({ message: "ID da lista inválido" }),
});

export const schemaSalvarProgresso = z.object({
  questaoId: z.string().cuid({ message: "ID da questão inválido" }),
  alternativaMarcada: z.nativeEnum(AlternativaQuestao, { 
    error: "Alternativa inválida" 
  }),
});