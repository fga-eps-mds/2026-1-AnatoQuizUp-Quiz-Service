import type { AlternativaQuestao } from "@prisma/client";
import type { ConquistaDesbloqueadaDto } from "@/modules/conquistas/conquistas.dto";

export type FeedbackQuizDto = {
  correcao: boolean;
  saibaMais: string | null;
  respostaCorreta: AlternativaQuestao;
  saldoMoedas: number;
  moedasConcedidas: number;
  moedasJaConcedidas: boolean;
  conquistasDesbloqueadas: ConquistaDesbloqueadaDto[];
};

export type SaldoMoedasDto = {
  saldoMoedas: number;
};
