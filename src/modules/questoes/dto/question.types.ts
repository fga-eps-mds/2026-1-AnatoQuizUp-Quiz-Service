import type {
  AlternativaQuestao,
  Questao,
  QuestaoAlternativa,
  StatusQuestao,
  Tema,
  Dificuldade,
  Prisma,
  TaxonomiaBloom,
  OrigemQuestao,
} from "@prisma/client";

export const TIPO_QUESTAO_API = {
  MULTIPLA_ESCOLHA: "MULTIPLA_ESCOLHA",
  CERTO_ERRADO: "CERTO_ERRADO",
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

export type AlternativasCertoErradoDto = {
  C: string;
  E: string;
};

export type AlternativasQuestaoDto =
  | AlternativasMultiplaEscolhaDto
  | AlternativasCertoErradoDto;

export type CriarQuestaoDto = {
  tema: string;
  enunciado: string;
  tipo: TipoQuestaoApi;
  dificuldade: Dificuldade;
  imagem: string;
  alternativaCorreta: AlternativaQuestao;
  saibaMais: string;
  taxonomiaBloom?: TaxonomiaBloom;
  origemQuestao?: OrigemQuestao;
  regiaoAnatomica?: string;
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
  taxonomiaBloom?: TaxonomiaBloom;
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
  saibaMais: string | null;
  taxonomiaBloom: TaxonomiaBloom | null;
  origemQuestao: OrigemQuestao;
  regiaoAnatomica: string | null;
  alternativas: Partial<AlternativasMultiplaEscolhaDto>;
  status: StatusQuestao;
  criadoPorId: string;
  criadoEm: string;
  atualizadoEm: string;
  excluidoEm: string | null;
};

export function montarAlternativas(tipo: TipoQuestaoApi, alternativas: QuestaoAlternativa | null) {
  if (tipo === TIPO_QUESTAO_API.CERTO_ERRADO) {
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
  const tipo = questao.tipoQuestao;
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
    saibaMais: questao.saibaMais,
    taxonomiaBloom: questao.taxonomiaBloom,
    origemQuestao: questao.origemQuestao,
    regiaoAnatomica: questao.regiaoAnatomica,
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
    where.tipoQuestao = filtros.tipo;
  }

  if (filtros.taxonomiaBloom) {
    where.taxonomiaBloom = filtros.taxonomiaBloom;
  }

  return where;
}
