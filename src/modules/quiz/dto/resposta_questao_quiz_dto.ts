import type {
  AlternativasMultiplaEscolhaDto,
  DificuldadeApi,
  TipoQuestaoApi,
} from "@/modules/questao/dto/questao.types";
import type { StatusQuestao } from "@prisma/client";

export type RespostaQuestaoQuizDto = {
  id: string;
  tema: {
    id: string;
    nome: string;
  };
  enunciado: string;
  tipo: TipoQuestaoApi;
  dificuldade: DificuldadeApi;
  imagem: string | null;
  alternativas: Partial<AlternativasMultiplaEscolhaDto>;
  status: StatusQuestao;
};
