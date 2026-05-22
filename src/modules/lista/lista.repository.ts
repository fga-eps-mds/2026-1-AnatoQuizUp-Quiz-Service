import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import type { FiltrosListaDTO } from './dto/lista.types';

const prisma = new PrismaClient();

export class ListaQuestaoRepository {
  async buscarPorId(id: string) {
    return prisma.listaQuestao.findUnique({
      where: { id, excluidoEm: null },
      include: {
        itens: {
          include: { questao: true },
          orderBy: { ordem: 'asc' },
        },
        turmas: {
          include: { turma: true },
        },
      },
    });
  }

  async listarDoProfessor(professorId: string, filtros?: FiltrosListaDTO) {
    const where: Prisma.ListaQuestaoWhereInput = {
      criadoPorId: professorId,
      excluidoEm: null,
    };

    // Filtro por nome (case insensitive)
    if (filtros?.busca) {
      where.nome = {
        contains: filtros.busca,
        mode: 'insensitive',
      };
    }

    if (filtros?.status === 'PUBLICADA') {
      where.turmas = { some: {} };
    } else if (filtros?.status === 'RASCUNHO') {
      where.turmas = { none: {} };
    }

    return prisma.listaQuestao.findMany({
      where,
      include: {
        _count: {
          select: { itens: true }, 
        },
        turmas: {
          include: { turma: true }, 
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async listarPorTurma(turmaId: string) {
    return prisma.listaQuestao.findMany({
      where: {
        excluidoEm: null,
        turmas: {
          some: { turmaId },
        },
      },
      include: {
        itens: {
          include: { questao: true },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async deletar(id: string) {
    return prisma.listaQuestao.update({
      where: { id },
      data: { excluidoEm: new Date() },
    });
  }

  async buscarEstatisticasTurma(listaId: string, turmaId: string) {
    const itens = await prisma.listaQuestaoItem.findMany({
      where: { listaQuestaoId: listaId },
      select: { questaoId: true },
    });
    const questoesIds = itens.map((i) => i.questaoId);

    const alunosTurma = await prisma.turmaAluno.findMany({
      where: { turmaId },
      select: { alunoId: true },
    });
    const alunosIds = alunosTurma.map((a) => a.alunoId);

    const resolucoes = await prisma.resolucaoQuestao.findMany({
      where: {
        questaoId: { in: questoesIds },
        usuarioId: { in: alunosIds },
      },
      include: { questao: true },
    });

    return { alunosIds, resolucoes };
  }
}