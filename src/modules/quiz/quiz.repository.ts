import type {
  FiltroListarQuestoesQueryDto,
  RegistroQuestaoCompleta,
} from "@/modules/questoes/dto/question.types";
import { mapearTipoApiParaBanco, montarFiltroPrisma } from "@/modules/questoes/dto/question.types";
import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";
import type { ResponderQuestaoQuizDto } from "./dto/requests/responder_questao_quiz_dto";
import type { Prisma, Questao, QuestaoAlternativa, ResolucaoQuestao, Tema } from "@prisma/client";

const includeQuestaoCompleta = {
  tema: true,
  alternativas: true,
};

const selectListarQuestoesRespondidas = {
  id: true,
  questaoId: true,
  respostaMarcada: true,
  criadoEm: true,
  questao: {
    select: {
      enunciado: true,
      tipoQuestao: true,
      respostaCorreta: true,
      saibaMais: true,
      status: true,
      feitoPorIa: true,
      urlImagem: true,
      dificuldade: true,
      tema: {
        select: {
          id: true,
          nome: true,
        },
      },
      alternativas: {
        select: {
          alternativaA: true,
          alternativaB: true,
          alternativaC: true,
          alternativaD: true,
          alternativaE: true,
        },
      },
    },
  },
};

export type RegistroResolucaoQuestaoCompleta = ResolucaoQuestao & {
  questao: Questao & {
    tema: Tema;
    alternativas: QuestaoAlternativa | null;
  };
};

export class QuizRepository {
  async filtrarQuestoesQuiz(paginacao: ParametrosPaginacao, filtros: FiltroListarQuestoesQueryDto) {
    const where = montarFiltroPrisma(filtros);

    const [data, total] = await prisma.$transaction([
      prisma.questao.findMany({
        where,
        include: includeQuestaoCompleta,
        skip: paginacao.skip,
        take: paginacao.limit,
      }),

      prisma.questao.count({ where }),
    ]);

    return { data: data as RegistroQuestaoCompleta[], total };
  }

  async registrarTentativa(data: ResponderQuestaoQuizDto, usuarioId: string) {
    return await prisma.resolucaoQuestao.create({
      data: {
        respostaMarcada: data.respostaMarcada,
        questaoId: data.questaoId,
        usuarioId: usuarioId,
      },
    });
  }

  async buscarResposta(id: string) {
    return await prisma.questao.findUnique({
      where: { id, excluidoEm: null },
      select: { respostaCorreta: true, saibaMais: true },
    });
  }

  async contarQuestoesQuiz(filtros: FiltroListarQuestoesQueryDto) {
    const where = montarFiltroPrisma(filtros);
    return await prisma.questao.count({ where });
  }

  async buscarQuantidadeDeQuestoesPorTema() {
    return await prisma.tema.findMany({
      select: {
        nome: true,
        questoes: {
          select: {
            dificuldade: true,
          },
        },
        _count: {
          select: {
            questoes: true,
          },
        },
      },
    });
  }

  async listarQuestoesRespondidas(
    usuarioId: string,
    paginacao: ParametrosPaginacao,
    filtros: FiltroListarQuestoesQueryDto,
  ) {
    const where: Prisma.ResolucaoQuestaoWhereInput = {
      usuarioId,
      excluidoEm: null,

      questao: {
        excluidoEm: null,
        status: "ATIVO",

        ...(filtros.tema && {
          temaId: filtros.tema,
        }),

        ...(filtros.dificuldade && {
          dificuldade: filtros.dificuldade,
        }),

        ...(filtros.tipo && {
          tipoQuestao: mapearTipoApiParaBanco(filtros.tipo),
        }),
      },
    };

    const [data, total] = await prisma.$transaction([
      prisma.resolucaoQuestao.findMany({
        distinct: ["questaoId"],
        where,
        select: selectListarQuestoesRespondidas,
        skip: paginacao.skip,
        take: paginacao.limit,
        orderBy: {
          criadoEm: "desc",
        },
      }),
      prisma.resolucaoQuestao.groupBy({
        by: ["questaoId"],
        where,
      }),
    ]);

    return { data: data, total: total.length };
  }

  async buscarQuantidadeRespostasQuestoes(usuarioId: string, questoesIds: string[]) {
    return await prisma.resolucaoQuestao.groupBy({
      by: ["questaoId", "respostaMarcada"],

      where: {
        questaoId: {
          in: questoesIds,
        },
        usuarioId,
        excluidoEm: null,
      },

      _count: {
        _all: true,
      },
    });
  }
}
