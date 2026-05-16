import type { TipoQuestaoApi } from "@/modules/questao/dto/questao.types";
import type { AlternativaQuestao } from "@prisma/client";

export type ResponderQuestaoQuizDto = {
  questaoId: string;
  tipo: TipoQuestaoApi;
  respostaMarcada: AlternativaQuestao;
};
