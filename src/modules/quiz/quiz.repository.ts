import type { Prisma } from "@prisma/client";
import type { FiltroQuestaoQuizQueryDto } from "./dto/filtro_questao_quiz_query_dto";
import type {
  FiltroListarQuestoesQueryDto,
  RegistroQuestaoCompleta,
} from "@/modules/questoes/dto/question.types";
import { mapearTipoApiParaBanco } from "@/modules/questoes/dto/question.types";
import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";

const includeQuestaoCompleta = {
  tema: true,
  alternativas: true,
};

export class QuizRepository {
  async filtrar_aleatorio(filtros: FiltroQuestaoQuizQueryDto): Promise<RegistroQuestaoCompleta | null> {
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

    const numero_questoes = (await prisma.questao.count()) - 1;

    const off_set = Math.floor(Math.random() * numero_questoes);

    const questao = await prisma.questao.findFirst({
      where,
      skip: off_set,
      include: includeQuestaoCompleta,
    });

    return questao;
  }

  async filtrar_questoes_quiz(
    paginacao: ParametrosPaginacao,
    filtros: FiltroListarQuestoesQueryDto,
  ) {
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

  async contarQuestoesQuiz(filtros: FiltroListarQuestoesQueryDto) {
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

    return await prisma.questao.count({where});
  }
}
