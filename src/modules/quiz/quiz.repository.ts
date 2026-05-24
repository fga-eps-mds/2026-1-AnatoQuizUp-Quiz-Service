import type {
  FiltroListarQuestoesQueryDto,
  RegistroQuestaoCompleta,
} from "@/modules/questoes/dto/question.types";
import { montarFiltroPrisma } from "@/modules/questoes/dto/question.types";
import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";
import type { ResponderQuestaoQuizDto } from "./dto/responder_questao_quiz_dto";
import { FonteMoeda } from "@prisma/client";

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
      select: { respostaCorreta: true, saibaMais: true, dificuldade: true },
    });
  }

  async buscarSaldoMoedas(usuarioId: string) {
    const carteira = await prisma.carteiraMoedas.findUnique({
      where: { usuarioId },
      select: { saldo: true },
    });

    return carteira?.saldo ?? 0;
  }

  async concederMoedasPorAcerto(usuarioId: string, questaoId: string, quantidade: number) {
    return await prisma.$transaction(async (tx) => {
      await tx.carteiraMoedas.upsert({
        where: { usuarioId },
        create: { usuarioId, saldo: 0 },
        update: {},
      });

      const transacao = await tx.transacaoMoeda.createMany({
        data: [
          {
            usuarioId,
            questaoId,
            quantidade,
            fonte: FonteMoeda.ACERTO_QUESTAO,
          },
        ],
        skipDuplicates: true,
      });

      if (transacao.count === 0) {
        const carteira = await tx.carteiraMoedas.findUnique({
          where: { usuarioId },
          select: { saldo: true },
        });

        return {
          moedasConcedidas: 0,
          saldoMoedas: carteira?.saldo ?? 0,
          moedasJaConcedidas: true,
        };
      }

      const carteiraAtualizada = await tx.carteiraMoedas.update({
        where: { usuarioId },
        data: { saldo: { increment: quantidade } },
        select: { saldo: true },
      });

      return {
        moedasConcedidas: quantidade,
        saldoMoedas: carteiraAtualizada.saldo,
        moedasJaConcedidas: false,
      };
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
          where: {
            status: "ATIVO",
            excluidoEm: null,
          },
          select: {
            dificuldade: true,
          },
        },

        _count: {
          select: {
            questoes: {
              where: {
                status: "ATIVO",
                excluidoEm: null,
              },
            },
          },
        },
      },
    });
  }
}
