import { z } from 'zod';

const schemaCuid = (mensagem: string) => z.string().cuid(mensagem);

const schemaIds = (mensagem: string) => z.array(schemaCuid(mensagem)).optional();

const schemaIdsObrigatorios = (mensagem: string) =>
  z.array(schemaCuid(mensagem)).min(1, 'Informe ao menos um ID.');

export const schemaParametroId = z.object({
  id: schemaCuid('ID da lista invalido.'),
});

export const schemaEstatisticasParams = z.object({
  id: schemaCuid('ID da lista invalido.'),
  turmaId: schemaCuid('ID da turma invalido.'),
});

export const schemaParametroTurmaId = z.object({
  turmaId: schemaCuid('ID da turma invalido.'),
});

export const schemaParametroListaQuestao = z.object({
  id: schemaCuid('ID da lista invalido.'),
  questaoId: schemaCuid('ID da questao invalido.'),
});

export const schemaParametroListaTurma = z.object({
  id: schemaCuid('ID da lista invalido.'),
  turmaId: schemaCuid('ID da turma invalido.'),
});

export const schemaListarListas = z.object({
  busca: z.string().optional(),
  status: z.enum(['PUBLICADA', 'RASCUNHO']).optional(),
});

export const schemaCriarLista = z.object({
  nome: z.string().trim().min(1, 'Nome da lista e obrigatorio.').max(120),
  questoesIds: schemaIds('ID da questao invalido.'),
  turmasIds: schemaIds('ID da turma invalido.'),
});

export const schemaAtualizarLista = z
  .object({
    nome: z.string().trim().min(1, 'Nome da lista e obrigatorio.').max(120).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export const schemaVincularQuestoes = z.object({
  questoesIds: schemaIdsObrigatorios('ID da questao invalido.'),
});

export const schemaReordenarQuestoes = z.object({
  questoesIds: schemaIdsObrigatorios('ID da questao invalido.'),
});

export const schemaVincularTurmas = z.object({
  turmasIds: schemaIdsObrigatorios('ID da turma invalido.'),
});
