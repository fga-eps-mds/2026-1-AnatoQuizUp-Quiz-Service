import type { AlternativaQuestao } from "@prisma/client";

export type FeedbackQuizDto = {
  correcao: boolean;
  saibaMais: string | null;
  respostaCorreta: AlternativaQuestao;
  moedasConcedidas: number;
  saldoMoedas: number;
  moedasJaConcedidas: boolean;
};

export type SaldoMoedasDto = {
  saldoMoedas: number;
};