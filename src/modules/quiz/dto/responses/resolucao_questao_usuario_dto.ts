import type { DificuldadeApi, TipoQuestaoApi } from "@/modules/questoes/dto/question.types";
import type { AlternativaQuestao, OrigemQuestao, StatusQuestao } from "@prisma/client";

// Alternativas parciais: certo/errado traz so C/E, multipla escolha traz A-E.
export type AlternativasDto = Partial<{
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  alternativaE: string;
}>;

// Item do historico: a resolucao do usuario com a questao e suas estatisticas.
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
    origemQuestao: OrigemQuestao;
    urlImagem: string | null;
    dificuldade: DificuldadeApi;
    alternativas: AlternativasDto | null;
  };
  respostaMarcada: AlternativaQuestao;
  questaoId: string;
};
