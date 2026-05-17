import type { Prisma, ResolucaoQuestao } from "@prisma/client";
import type {
  FiltroListarQuestoesQueryDto,
  RegistroQuestaoCompleta,
} from "@/modules/questoes/dto/question.types";
import { montarFiltroPrisma } from "@/modules/questoes/dto/question.types";
import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";
import type { ResponderQuestaoQuizDto } from "./dto/responder_questao_quiz_dto";

const includeQuestaoCompleta = {
  tema: true,
  alternativas: true,
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
    return (await prisma.resolucaoQuestao.create({
      data: {
        respostaMarcada: data.respostaMarcada,
        questaoId: data.questaoId,
        usuarioId: usuarioId,
      },
    })) as ResolucaoQuestao;
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
}
