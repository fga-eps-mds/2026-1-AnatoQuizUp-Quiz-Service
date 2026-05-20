import type {
  FiltroListarQuestoesQueryDto,
  RegistroQuestaoCompleta,
} from "@/modules/questoes/dto/question.types";
import { montarFiltroPrisma } from "@/modules/questoes/dto/question.types";
import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";

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

  async contarQuestoesQuiz(filtros: FiltroListarQuestoesQueryDto) {
    const where = montarFiltroPrisma(filtros);
    return await prisma.questao.count({ where });
  }
}
