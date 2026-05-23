import { DificuldadeApi, TipoQuestaoApi } from "@/modules/questoes/dto/question.types";
import { AlternativaQuestao, StatusQuestao } from "@prisma/client";

export type ResolucaoQuestaoUsuarioDto = {
  id: string;
  criadoEm: Date;

  tentativas: number;

  distribuicao: Record<string, number>;

  questao: {
    tema: {
      id: string;
      nome: string;
    };

    enunciado: string;

    tipoQuestao: TipoQuestaoApi;

    respostaCorreta: AlternativaQuestao;

    saibaMais: string | null;

    status: StatusQuestao;

    feitoPorIa: boolean;

    urlImagem: string | null;

    dificuldade: DificuldadeApi;

    alternativas: {
      alternativaA: string;
      alternativaB: string;
      alternativaC: string;
      alternativaD: string;
      alternativaE: string;
    } | null;
  };

  respostaMarcada: AlternativaQuestao;

  questaoId: string;
};
