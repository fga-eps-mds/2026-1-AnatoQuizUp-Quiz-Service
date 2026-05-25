import { z } from "zod";

import { TIPO_QUESTAO_API } from "../questoes/dto/question.types";
import { VALORES_DIFICULDADE } from "../questoes/questoes.schemas";

export const schemaBuscarQuestaoQuiz = z.object({
  tema: z.string().trim().optional(),

  dificuldade: z.enum(VALORES_DIFICULDADE).optional(),

  tipo: z.enum([TIPO_QUESTAO_API.MULTIPLA_ESCOLHA, TIPO_QUESTAO_API.VERDADEIRO_FALSO]).optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const schemaResponderQuestaoQuiz = z.discriminatedUnion("tipo", [
  z.object({
    questaoId: z.string().trim().min(1),

    tipo: z.literal(TIPO_QUESTAO_API.MULTIPLA_ESCOLHA),

    respostaMarcada: z.enum(["A", "B", "C", "D", "E"]),
  }),

  z.object({
    questaoId: z.string().trim().min(1),

    tipo: z.literal(TIPO_QUESTAO_API.VERDADEIRO_FALSO),

    respostaMarcada: z.enum(["C", "E"]),
  }),
]);

export const schemaHistoricoQuizQuestoesUsuario = z.object({
  tema: z.string().trim().optional(),

  dificuldade: z.enum(VALORES_DIFICULDADE).optional(),

  tipo: z.enum([TIPO_QUESTAO_API.MULTIPLA_ESCOLHA, TIPO_QUESTAO_API.VERDADEIRO_FALSO]).optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});
