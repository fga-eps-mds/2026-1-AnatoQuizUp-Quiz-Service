import type {
  AlternativaQuestao,
  Questao,
  QuestaoAlternativa,
  StatusQuestao,
  Tema,
  TipoQuestao,
  Dificuldade,
  Prisma,
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

export function montarAlternativas(tipo: TipoQuestaoApi, alternativas: QuestaoAlternativa | null) {
  if (tipo === TIPO_QUESTAO_API.VERDADEIRO_FALSO) {
    return {
      C: alternativas?.alternativaC,
      E: alternativas?.alternativaE,
    };
  }

  return {
    A: alternativas?.alternativaA,
    B: alternativas?.alternativaB,
    C: alternativas?.alternativaC,
    D: alternativas?.alternativaD,
    E: alternativas?.alternativaE,
  };
}

export function converterParaRespostaQuestao(questao: RegistroQuestaoCompleta): RespostaQuestaoDto {
  const tipo = mapearTipoBancoParaApi(questao.tipoQuestao);
  const alternativas = montarAlternativas(tipo, questao.alternativas);

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

export function montarFiltroPrisma(
  filtros: FiltroListarQuestoesQueryDto,
): Prisma.QuestaoWhereInput {
  const where: Prisma.QuestaoWhereInput = {
    excluidoEm: null,
    status: "ATIVO",
  };

  if (filtros.tema) {
    where.tema = { nome: { contains: filtros.tema, mode: "insensitive" } };
  }

  if (filtros.dificuldade) {
    where.dificuldade = filtros.dificuldade;
  }

  if (filtros.tipo) {
    where.tipoQuestao = mapearTipoApiParaBanco(filtros.tipo);
  }

  return where;
}
