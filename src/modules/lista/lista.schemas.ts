import { z } from 'zod';

// Schemas Zod de validacao das rotas de listas (params, query e body).

// Helper: valida um id no formato cuid com mensagem customizada.
const schemaCuid = (mensagem: string) => z.string().cuid(mensagem);

// Helper: array opcional de ids cuid.
const schemaIds = (mensagem: string) => z.array(schemaCuid(mensagem)).optional();

// Helper: array de ids cuid exigindo ao menos um elemento.
const schemaIdsObrigatorios = (mensagem: string) =>
  z.array(schemaCuid(mensagem)).min(1, 'Informe ao menos um ID.');

// Prazo do vinculo: data ISO valida, nulo (sem prazo) ou ausente.
const schemaPrazoVinculo = z
  .union([
    z
      .string()
      .trim()
      .min(1, 'Prazo invalido.')
      .refine((valor) => !Number.isNaN(Date.parse(valor)), 'Prazo invalido.'),
    z.null(),
  ])
  .optional();

// Params: apenas o id da lista.
export const schemaParametroId = z.object({
  id: schemaCuid('ID da lista invalido.'),
});

// Params da rota de estatisticas: lista + turma.
export const schemaEstatisticasParams = z.object({
  id: schemaCuid('ID da lista invalido.'),
  turmaId: schemaCuid('ID da turma invalido.'),
});

// Params: apenas o id da turma.
export const schemaParametroTurmaId = z.object({
  turmaId: schemaCuid('ID da turma invalido.'),
});

// Params do vinculo lista<->questao.
export const schemaParametroListaQuestao = z.object({
  id: schemaCuid('ID da lista invalido.'),
  questaoId: schemaCuid('ID da questao invalido.'),
});

// Params do vinculo lista<->turma.
export const schemaParametroListaTurma = z.object({
  id: schemaCuid('ID da lista invalido.'),
  turmaId: schemaCuid('ID da turma invalido.'),
});

// Query da listagem: busca textual e filtro por status.
export const schemaListarListas = z.object({
  busca: z.string().optional(),
  status: z.enum(['PUBLICADA', 'RASCUNHO']).optional(),
});

// Body de criacao da lista (nome obrigatorio; questoes/turmas opcionais ja no ato).
export const schemaCriarLista = z.object({
  nome: z.string().trim().min(1, 'Nome da lista e obrigatorio.').max(120),
  questoesIds: schemaIds('ID da questao invalido.'),
  turmasIds: schemaIds('ID da turma invalido.'),
});

// Body de atualizacao: exige ao menos um campo informado.
export const schemaAtualizarLista = z
  .object({
    nome: z.string().trim().min(1, 'Nome da lista e obrigatorio.').max(120).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

// Body para vincular questoes a uma lista.
export const schemaVincularQuestoes = z.object({
  questoesIds: schemaIdsObrigatorios('ID da questao invalido.'),
});

// Body para reordenar questoes: a ordem do array define a nova posicao.
export const schemaReordenarQuestoes = z.object({
  questoesIds: schemaIdsObrigatorios('ID da questao invalido.'),
});

// Formato antigo de vinculo (apenas ids), mantido por compatibilidade.
const schemaVincularTurmasLegado = z.object({
  turmasIds: schemaIdsObrigatorios('ID da turma invalido.'),
});

// Formato novo de vinculo: uma turma com prazo e gabarito configuraveis.
export const schemaVincularTurmaComConfig = z.object({
  turmaId: schemaCuid('ID da turma invalido.'),
  prazo: schemaPrazoVinculo,
  gabaritoLiberado: z.boolean().optional(),
});

// Aceita os dois formatos de vinculo (legado ou com config).
export const schemaVincularTurmas = z.union([
  schemaVincularTurmasLegado,
  schemaVincularTurmaComConfig,
]);

// Body de atualizacao do vinculo: ao menos prazo ou gabarito deve estar presente.
export const schemaAtualizarVinculoListaTurma = z
  .object({
    prazo: schemaPrazoVinculo,
    gabaritoLiberado: z.boolean().optional(),
  })
  .refine(
    (data) =>
      Object.prototype.hasOwnProperty.call(data, 'prazo') ||
      Object.prototype.hasOwnProperty.call(data, 'gabaritoLiberado'),
    {
      message: 'Informe ao menos um campo para atualizar.',
    },
  );
