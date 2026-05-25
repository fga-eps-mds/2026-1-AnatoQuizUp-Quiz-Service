import type { TipoQuestaoApi } from "@/modules/questoes/dto/question.types.ts";
import type { AlternativaQuestao } from "@prisma/client";

export type ResponderQuestaoQuizDto = {
  questaoId: string;
  tipo: TipoQuestaoApi;
  respostaMarcada: AlternativaQuestao;
};