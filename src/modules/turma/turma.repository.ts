import { PrismaClient, Turma } from '@prisma/client';
import { prisma } from '@/config/db';
import { FiltrosListagemTurma } from './dto/turma.types';

export type TurmaComContagem = Turma & {
  _count: { alunos: number };
};

export class TurmaRepository {
  
  async buscarPorId(id: string): Promise<TurmaComContagem | null> {
    return prisma.turma.findUnique({
      where: { 
        id, 
        excluidoEm: null 
      },
      include: {
        _count: {
          select: { alunos: true } 
        }
      }
    });
  }

  async listarComFiltros(filtros: FiltrosListagemTurma): Promise<TurmaComContagem[]> {
    return prisma.turma.findMany({
      where: {
        excluidoEm: null,
        professorId: filtros.professorId,
        status: filtros.status,
        OR: filtros.busca ? [
          { nome: { contains: filtros.busca, mode: 'insensitive' } },
          { codigo: { contains: filtros.busca, mode: 'insensitive' } }
        ] : undefined
      },
      orderBy: { criadoEm: 'desc' },
      include: {
        _count: {
          select: { alunos: true }
        }
      }
    });
  }

  async deletarLogico(id: string): Promise<void> {
    await prisma.turma.update({
      where: { id },
      data: { 
        excluidoEm: new Date(),
        status: 'INATIVA' 
      }
    });
  }
}