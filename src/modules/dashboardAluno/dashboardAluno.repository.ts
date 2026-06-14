import { prisma } from "@/config/db";

const selectResolucaoDashboard = {
  respostaMarcada: true,
  questao: {
    select: {
      respostaCorreta: true,
      tema: { select: { id: true, nome: true } },
    },
  },
} as const;

export class DashboardAlunoRepository {
  async buscarResolucoesPorUsuario(usuarioId: string) {
    return prisma.resolucaoQuestao.findMany({
      where: {
        usuarioId,
        excluidoEm: null,
        questao: { excluidoEm: null },
      },
      select: selectResolucaoDashboard,
    });
  }

  async buscarListasDoUsuario(usuarioId: string) {
    return prisma.listaTurma.findMany({
      where: {
        turma: {
          alunos: {
            some: { alunoId: usuarioId },
          },
        },
      },
      select: {
        id: true,
        prazo: true,
        listaQuestao: {
          select: {
            nome: true,
            _count: {
              select: { itens: true },
            },
          },
        },
        resolucoes: {
          where: { alunoId: usuarioId },
          select: {
            status: true,
            submissaoEm: true,
            respostas: {
              select: {
                respostaMarcada: true,
                questao: { select: { respostaCorreta: true } },
              },
            },
          },
        },
      },
      orderBy: { criadoEm: "desc" },
    });
  }
}