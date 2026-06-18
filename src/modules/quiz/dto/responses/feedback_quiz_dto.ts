import type { AlternativaQuestao } from "@prisma/client";

export type FeedbackQuizDto = {
  correcao: boolean;
  saibaMais: string | null;
  respostaCorreta: AlternativaQuestao;
  saldoMoedas: number;
  moedasConcedidas: number;
  moedasJaConcedidas: boolean;
  conquistasDesbloqueadas: {
    conquistaId: string;
    nome: string;
    descricao: string;
    tier: string;
    moedasConcedidas: number;
  }[];
};

export type SaldoMoedasDto = {
  saldoMoedas: number;
};