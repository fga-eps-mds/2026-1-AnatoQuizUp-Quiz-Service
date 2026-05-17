import type { DificuldadeApi, TipoQuestaoApi } from "@/modules/questoes/dto/question.types";

export type FiltroQuestaoQuizQueryDto = {
  tema?: string;
  dificuldade?: DificuldadeApi;
  tipo?: TipoQuestaoApi;
  id_questao_evitar?: string[];
};
