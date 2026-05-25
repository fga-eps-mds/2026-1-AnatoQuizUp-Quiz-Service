import type { AlternativaQuestao } from "@prisma/client";

export type FeedbackQuizDto = {
  correcao: boolean;
  saibaMais: string;
  respostaCorreta: AlternativaQuestao;
};