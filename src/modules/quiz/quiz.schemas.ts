import { z } from "zod";

import { TIPO_QUESTAO_API } from "../questoes/dto/question.types";
import { VALORES_DIFICULDADE } from "../questoes/questoes.schemas";

// Schemas Zod do quiz: filtros de busca, resposta e historico.

// Query da busca de questoes: filtros opcionais e paginacao (limite ate 100).
export const schemaBuscarQuestaoQuiz = z.object({
  tema: z.string().trim().optional(),

  dificuldade: z.enum(VALORES_DIFICULDADE).optional(),

  tipo: z.enum([TIPO_QUESTAO_API.MULTIPLA_ESCOLHA, TIPO_QUESTAO_API.CERTO_ERRADO]).optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// Body da resposta: union discriminada por "tipo" para validar as alternativas certas.
export const schemaResponderQuestaoQuiz = z.discriminatedUnion("tipo", [
  // Multipla escolha: alternativas de A a E.
  z.object({
    questaoId: z.string().trim().min(1),

    tipo: z.literal(TIPO_QUESTAO_API.MULTIPLA_ESCOLHA),

    respostaMarcada: z.enum(["A", "B", "C", "D", "E"]),
  }),

  // Certo/errado: apenas C (certo) ou E (errado).
  z.object({
    questaoId: z.string().trim().min(1),

    tipo: z.literal(TIPO_QUESTAO_API.CERTO_ERRADO),

    respostaMarcada: z.enum(["C", "E"]),
  }),
]);

// Query do historico: mesmos filtros/paginacao da busca de questoes.
export const schemaHistoricoQuizQuestoesUsuario = z.object({
  tema: z.string().trim().optional(),

  dificuldade: z.enum(VALORES_DIFICULDADE).optional(),

  tipo: z.enum([TIPO_QUESTAO_API.MULTIPLA_ESCOLHA, TIPO_QUESTAO_API.CERTO_ERRADO]).optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});
