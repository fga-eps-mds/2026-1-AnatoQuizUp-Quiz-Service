import { prisma } from "@/config/db";

// Projecao reutilizada: traz so o necessario para calcular acertos por tema (resposta + gabarito).
const selectResolucaoDashboard = {
  respostaMarcada: true,
  questao: {
    select: {
      respostaCorreta: true,
      tema: { select: { id: true, nome: true } },
    },
  },
} as const;

// Repository do dashboard do aluno: consultas Prisma de resolucoes e listas do usuario.
export class DashboardAlunoRepository {
  /**
   * Busca as resolucoes (nao excluidas) do usuario para calcular desempenho por tema.
   *
   * @param usuarioId Id do usuario.
   * @returns Resolucoes do usuario com resposta e gabarito/tema da questao.
   */
  async buscarResolucoesPorUsuario(usuarioId: string) {
    return prisma.resolucaoQuestao.findMany({
      where: {
        usuarioId,
        excluidoEm: null,
        // Ignora resolucoes cuja questao foi removida (soft delete).
        questao: { excluidoEm: null },
      },
      select: selectResolucaoDashboard,
    });
  }

  /**
   * Busca as listas das turmas do aluno, com prazo, total de itens e suas resolucoes.
   *
   * @param usuarioId Id do aluno.
   * @returns Listas-turma do aluno com itens e resolucoes, mais recentes primeiro.
   */
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
            // _count.itens = quantidade de questoes da lista (denominador do progresso).
            _count: {
              select: { itens: true },
            },
          },
        },
        resolucoes: {
          // So as resolucoes do proprio aluno interessam para o dashboard dele.
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