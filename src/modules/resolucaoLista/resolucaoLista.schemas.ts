import { z } from 'zod';
import { AlternativaQuestao } from '@prisma/client';

// Schemas Zod da resolucao de listas pelo aluno.

// Query da listagem: filtros opcionais e paginacao com valores padrao.
export const schemaListarListas = z.object({
  turmaId: z.string().optional(),
  status: z.enum(['PENDENTE', 'RESPONDIDA', 'EXPIRADA']).optional(),
  busca: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),
});

// Params para abrir uma lista pelo id.
export const schemaBuscarListaPorId = z.object({
  id: z.string().cuid({ message: "ID da lista inválido" }),
});

// Params para submeter uma lista pelo id.
export const schemaSubmeterLista = z.object({
  id: z.string().cuid({ message: "ID da lista inválido" }),
});

// Body do autosave: questao + alternativa marcada (enum do Prisma).
export const schemaSalvarProgresso = z.object({
  questaoId: z.string().cuid({ message: "ID da questão inválido" }),
  alternativaMarcada: z.nativeEnum(AlternativaQuestao, {
    error: "Alternativa inválida"
  }),
});