export interface QuestaoFormatadaDTO {
  id: string;
  enunciado: string;
  urlImagem: string | null;
  tema: string;
  tipoQuestao: string;
  alternativas: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  } | null;
  respostaMarcada: string | null;
  respostaCorreta?: string;
  saibaMais?: string | null;
}