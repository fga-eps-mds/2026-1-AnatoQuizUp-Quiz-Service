import type { Prisma } from "@prisma/client";
import type { FiltroQuestaoQuizQueryDto } from "./dto/filtro_questao_quiz_query_dto";
import type { FiltroListarQuestoesQueryDto, RegistroQuestaoCompleta } from "../questao/dto/questao.types";
import { mapearTipoApiParaBanco } from "../questao/dto/questao.types";
import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";

const includeQuestaoCompleta = {
  tema: true,
  alternativas: true,
};


export class QuizRepository {

  async filtrar(filtros: FiltroQuestaoQuizQueryDto): Promise<RegistroQuestaoCompleta | null> {
    const where: Prisma.QuestaoWhereInput = {
        excluidoEm: null,
        status: "ATIVO",
    };

    if (filtros.tema) {
        where.tema = { nome: { contains: filtros.tema, mode: 'insensitive' } };
    }
    
    if (filtros.dificuldade) {
        where.dificuldade = filtros.dificuldade;
    }
    
    if (filtros.tipo) {
        where.tipoQuestao = mapearTipoApiParaBanco(filtros.tipo);
    }
    console.log(where);
    
    const numero_questoes = await prisma.questao.count()-1;
    console.log(numero_questoes);

    const off_set = Math.floor(Math.random() * numero_questoes);
    console.log(off_set);

    const questao = await prisma.questao.findFirst({
        where,
        skip: off_set,
        include: includeQuestaoCompleta
    });
    console.log(questao);

    return questao;
      
  }


  async filtrar_questoes_quiz(paginacao: ParametrosPaginacao, filtros: FiltroListarQuestoesQueryDto) {
  
    const where: Prisma.QuestaoWhereInput = {
      excluidoEm: null,
      status: "ATIVO",
    };

    if (filtros.tema) {
      where.tema = { nome: { contains: filtros.tema, mode: 'insensitive' } };
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
}