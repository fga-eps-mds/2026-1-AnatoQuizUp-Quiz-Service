import type { Prisma, Turma, TurmaAluno } from '@prisma/client';
import { prisma } from '@/config/db';
import type {
  AtualizarTurmaDto,
  CriarTurmaDto,
  FiltrosListagemTurma,
  FiltrosListagemTurmaAluno,
  RespostaVinculoTurmaAluno
} from './dto/turma.types';

export type TurmaComContagem = Turma & {
  _count: { alunos: number };
};

const incluirContagemAlunosAtivos = {
  _count: {
    select: {
      alunos: {
        where: { excluidoEm: null }
      }
    }
  }
} satisfies Prisma.TurmaInclude;

const selecionarVinculoTurmaAluno = {
  id: true,
  turmaId: true,
  alunoId: true,
  criadoEm: true,
  atualizadoEm: true
} satisfies Prisma.TurmaAlunoSelect;

export class TurmaRepository {
  
  async buscarPorId(id: string): Promise<TurmaComContagem | null> {
    return prisma.turma.findUnique({
      where: { 
        id, 
        excluidoEm: null 
      },
      include: incluirContagemAlunosAtivos
    });
  }

  async buscarPorCodigo(codigo: string): Promise<Turma | null> {
    return prisma.turma.findUnique({
      where: { codigo }
    });
  }

  async listarComFiltros(filtros: FiltrosListagemTurma): Promise<TurmaComContagem[]> {
    return prisma.turma.findMany({
      where: {
        excluidoEm: null,
        professorId: filtros.professorId,
        status: filtros.status,
        semestre: filtros.semestre,
        ano: filtros.ano,
        OR: filtros.busca ? [
          { nome: { contains: filtros.busca, mode: 'insensitive' } },
          { codigo: { contains: filtros.busca, mode: 'insensitive' } }
        ] : undefined
      },
      orderBy: { criadoEm: 'desc' },
      include: incluirContagemAlunosAtivos
    });
  }

  async listarPorAluno(
    alunoId: string,
    filtros: FiltrosListagemTurmaAluno
  ): Promise<TurmaComContagem[]> {
    return prisma.turma.findMany({
      where: {
        excluidoEm: null,
        status: 'ATIVA',
        alunos: {
          some: {
            alunoId,
            excluidoEm: null
          }
        },
        semestre: filtros.semestre,
        ano: filtros.ano,
        OR: filtros.busca ? [
          { nome: { contains: filtros.busca, mode: 'insensitive' } },
          { codigo: { contains: filtros.busca, mode: 'insensitive' } }
        ] : undefined
      },
      orderBy: [
        { ano: 'desc' },
        { semestre: 'desc' },
        { criadoEm: 'desc' }
      ],
      include: incluirContagemAlunosAtivos
    });
  }

  async buscarVinculoAtivoAluno(turmaId: string, alunoId: string): Promise<TurmaAluno | null> {
    return prisma.turmaAluno.findFirst({
      where: {
        turmaId,
        alunoId,
        excluidoEm: null
      }
    });
  }

  async criar(data: CriarTurmaDto & { professorId: string }): Promise<TurmaComContagem> {
    return prisma.turma.create({
      data,
      include: incluirContagemAlunosAtivos
    });
  }

  async atualizar(id: string, data: AtualizarTurmaDto): Promise<TurmaComContagem> {
    return prisma.turma.update({
      where: { id },
      data,
      include: incluirContagemAlunosAtivos
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

  async listarAlunos(turmaId: string): Promise<RespostaVinculoTurmaAluno[]> {
    return prisma.turmaAluno.findMany({
      where: {
        turmaId,
        excluidoEm: null
      },
      orderBy: { criadoEm: 'desc' },
      select: selecionarVinculoTurmaAluno
    });
  }

  async buscarVinculoAluno(turmaId: string, alunoId: string): Promise<TurmaAluno | null> {
    return prisma.turmaAluno.findUnique({
      where: {
        turmaId_alunoId: {
          turmaId,
          alunoId
        }
      }
    });
  }

  async criarVinculoAluno(turmaId: string, alunoId: string): Promise<RespostaVinculoTurmaAluno> {
    return prisma.turmaAluno.create({
      data: {
        turmaId,
        alunoId
      },
      select: selecionarVinculoTurmaAluno
    });
  }

  async reativarVinculoAluno(id: string): Promise<RespostaVinculoTurmaAluno> {
    return prisma.turmaAluno.update({
      where: { id },
      data: { excluidoEm: null },
      select: selecionarVinculoTurmaAluno
    });
  }

  async desvincularAluno(id: string): Promise<void> {
    await prisma.turmaAluno.update({
      where: { id },
      data: { excluidoEm: new Date() }
    });
  }
}
