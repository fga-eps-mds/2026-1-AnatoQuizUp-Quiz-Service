import type {
  AlternativaQuestao,
  Questao,
  QuestaoAlternativa,
  StatusQuestao,
  Tema,
  TipoQuestao,
  Dificuldade,
} from "@prisma/client";

export const TIPO_QUESTAO_API = {
  MULTIPLA_ESCOLHA: "MULTIPLA_ESCOLHA",
  VERDADEIRO_FALSO: "VERDADEIRO_FALSO",
} as const;

export type TipoQuestaoApi = (typeof TIPO_QUESTAO_API)[keyof typeof TIPO_QUESTAO_API];

export const DIFICULDADE_API = {
  FACIL: "FACIL",
  MEDIA: "MEDIA",
  DIFICIL: "DIFICIL",
} as const;

export type DificuldadeApi = (typeof DIFICULDADE_API)[keyof typeof DIFICULDADE_API];

export type AlternativasMultiplaEscolhaDto = {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
};

export type AlternativasVerdadeiroFalsoDto = {
  C: string;
  E: string;
};

export type AlternativasQuestaoDto =
  | AlternativasMultiplaEscolhaDto
  | AlternativasVerdadeiroFalsoDto;

export type CriarQuestaoDto = {
  tema: string;
  enunciado: string;
  tipo: TipoQuestaoApi;
  dificuldade: Dificuldade;
  imagem: string;
  alternativaCorreta: AlternativaQuestao;
  explicacaoPedagogica: string;
  alternativas: AlternativasQuestaoDto;
};

export type AtualizarQuestaoDto = Partial<CriarQuestaoDto>;

export type ListarQuestoesQueryDto = {
  page?: number;
  limit?: number;
};

export type FiltroListarQuestoesQueryDto = {
  page?: number;
  limit?: number;
  tema?: string;
  dificuldade?: DificuldadeApi;
  tipo?: TipoQuestaoApi;
};

export type RegistroQuestaoCompleta = Questao & {
  tema: Tema;
  alternativas: QuestaoAlternativa | null;
};

export type RespostaQuestaoDto = {
  id: string;
  tema: {
    id: string;
    nome: string;
  };
  enunciado: string;
  tipo: TipoQuestaoApi;
  dificuldade: DificuldadeApi;
  imagem: string | null;
  alternativaCorreta: AlternativaQuestao;
  explicacaoPedagogica: string | null;
  alternativas: Partial<AlternativasMultiplaEscolhaDto>;
  status: StatusQuestao;
  criadoPorId: string;
  criadoEm: string;
  atualizadoEm: string;
  excluidoEm: string | null;
};

export function mapearTipoApiParaBanco(tipo: TipoQuestaoApi): TipoQuestao {
  return tipo === TIPO_QUESTAO_API.VERDADEIRO_FALSO ? "CERTO_ERRADO" : "MULTIPLA_ESCOLHA";
}

export function mapearTipoBancoParaApi(tipo: TipoQuestao): TipoQuestaoApi {
  return tipo === "CERTO_ERRADO"
    ? TIPO_QUESTAO_API.VERDADEIRO_FALSO
    : TIPO_QUESTAO_API.MULTIPLA_ESCOLHA;
}

export function converterParaRespostaQuestao(questao: RegistroQuestaoCompleta): RespostaQuestaoDto {
  const tipo = mapearTipoBancoParaApi(questao.tipoQuestao);
  const alternativas =
    tipo === TIPO_QUESTAO_API.VERDADEIRO_FALSO
      ? {
          C: questao.alternativas?.alternativaC,
          E: questao.alternativas?.alternativaE,
        }
      : {
          A: questao.alternativas?.alternativaA,
          B: questao.alternativas?.alternativaB,
          C: questao.alternativas?.alternativaC,
          D: questao.alternativas?.alternativaD,
          E: questao.alternativas?.alternativaE,
        };

  return {
    id: questao.id,
    tema: {
      id: questao.tema.id,
      nome: questao.tema.nome,
    },
    enunciado: questao.enunciado,
    tipo,
    dificuldade: questao.dificuldade as DificuldadeApi,
    imagem: questao.urlImagem,
    alternativaCorreta: questao.respostaCorreta,
    explicacaoPedagogica: questao.saibaMais,
    alternativas,
    status: questao.status,
    criadoPorId: questao.criadoPorId,
    criadoEm: questao.criadoEm.toISOString(),
    atualizadoEm: questao.atualizadoEm.toISOString(),
    excluidoEm: questao.excluidoEm?.toISOString() ?? null,
  };
}
