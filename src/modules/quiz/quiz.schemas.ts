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
