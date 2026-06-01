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
}

export type ResolucaoDashboardAluno = Awaited<
  ReturnType<DashboardAlunoRepository["buscarResolucoesPorUsuario"]>
>[number];
