import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TurmaDashboardRepository {
  async findAlunosByTurmaId(turmaId: string) {
    const matriculas = await prisma.turmaAluno.findMany({
      where: { turmaId },
      select: { alunoId: true },
    });
    return matriculas.map((m) => m.alunoId);
  }

  async findResolucoesByAlunos(alunosIds: string[]) {
    return await prisma.resolucaoQuestao.findMany({
      where: {
        usuarioId: { in: alunosIds },
      },
      include: {
        questao: {
          include: {
            tema: true,
          },
        },
      },
    });
  }
}