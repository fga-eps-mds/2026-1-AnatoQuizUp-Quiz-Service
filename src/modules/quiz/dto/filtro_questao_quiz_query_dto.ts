import type { DificuldadeApi, TipoQuestaoApi } from "@/modules/questao/dto/questao.types";

export type FiltroQuestaoQuizQueryDto = {
  tema?: string;
  dificuldade?: DificuldadeApi;
  tipo?: TipoQuestaoApi;
  id_questao_evitar?: string[];
};
