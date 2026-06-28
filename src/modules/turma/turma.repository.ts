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

// Repository de turmas (Prisma). Quase tudo respeita o soft delete (excluidoEm).

// Include que anexa a contagem de alunos ATIVOS (ignora vinculos excluidos).
const incluirContagemAlunosAtivos = {
  _count: {
    select: {
      alunos: {
        where: { excluidoEm: null }
      }
    }
  }
} satisfies Prisma.TurmaInclude;

// Projecao padrao do vinculo turma-aluno retornado nas respostas.
const selecionarVinculoTurmaAluno = {
  id: true,
  turmaId: true,
  alunoId: true,
  criadoEm: true,
  atualizadoEm: true
} satisfies Prisma.TurmaAlunoSelect;

export class TurmaRepository {
  /**
   * Busca uma turma nao excluida por id, com a contagem de alunos ativos.
   *
   * @param id Id da turma.
   * @returns A turma com a contagem, ou null se nao existir/estiver excluida.
   */
  async buscarPorId(id: string): Promise<TurmaComContagem | null> {
    return prisma.turma.findUnique({
      where: {
        id,
        excluidoEm: null
      },
      include: incluirContagemAlunosAtivos
    });
  }

  /**
   * Busca por codigo (inclui excluidas) — usado para validar unicidade do codigo.
   *
   * @param codigo Codigo da turma.
   * @returns A turma encontrada ou null.
   */
  async buscarPorCodigo(codigo: string): Promise<Turma | null> {
    return prisma.turma.findUnique({
      where: { codigo }
    });
  }

  /**
   * Lista turmas (visao professor/admin) com filtros de status/semestre/ano/busca.
   *
   * @param filtros Filtros de listagem (a busca casa nome ou codigo).
   * @returns Turmas que satisfazem os filtros, mais recentes primeiro.
   */
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

  /**
   * Lista as turmas ATIVAS em que o aluno tem vinculo ativo (visao do aluno).
   *
   * @param alunoId Id do aluno.
   * @param filtros Filtros de semestre/ano/busca.
   * @returns Turmas do aluno ordenadas por ano/semestre/criacao (desc).
   */
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

  /**
   * Vinculo ATIVO do aluno numa turma (usado no controle de acesso do aluno).
   *
   * @param turmaId Id da turma.
   * @param alunoId Id do aluno.
   * @returns O vinculo ativo ou null.
   */
  async buscarVinculoAtivoAluno(turmaId: string, alunoId: string): Promise<TurmaAluno | null> {
    return prisma.turmaAluno.findFirst({
      where: {
        turmaId,
        alunoId,
        excluidoEm: null
      }
    });
  }

  /**
   * Cria uma turma.
   *
   * @param data Dados da turma mais o professorId responsavel.
   * @returns A turma criada com a contagem de alunos.
   */
  async criar(data: CriarTurmaDto & { professorId: string }): Promise<TurmaComContagem> {
    return prisma.turma.create({
      data,
      include: incluirContagemAlunosAtivos
    });
  }

  /**
   * Atualiza os dados de uma turma.
   *
   * @param id Id da turma.
   * @param data Campos a atualizar.
   * @returns A turma atualizada com a contagem de alunos.
   */
  async atualizar(id: string, data: AtualizarTurmaDto): Promise<TurmaComContagem> {
    return prisma.turma.update({
      where: { id },
      data,
      include: incluirContagemAlunosAtivos
    });
  }

  /**
   * Soft delete da turma: marca excluidoEm e a deixa INATIVA.
   *
   * @param id Id da turma.
   */
  async deletarLogico(id: string): Promise<void> {
    await prisma.turma.update({
      where: { id },
      data: {
        excluidoEm: new Date(),
        status: 'INATIVA'
      }
    });
  }

  /**
   * Lista os vinculos de alunos ativos da turma.
   *
   * @param turmaId Id da turma.
   * @returns Vinculos turma-aluno ativos, mais recentes primeiro.
   */
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

  /**
   * Vinculo turma-aluno por chave composta, incluindo os excluidos (p/ reativacao).
   *
   * @param turmaId Id da turma.
   * @param alunoId Id do aluno.
   * @returns O vinculo (ativo ou excluido) ou null.
   */
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

  /**
   * Cria um novo vinculo turma-aluno.
   *
   * @param turmaId Id da turma.
   * @param alunoId Id do aluno.
   * @returns O vinculo criado.
   */
  async criarVinculoAluno(turmaId: string, alunoId: string): Promise<RespostaVinculoTurmaAluno> {
    return prisma.turmaAluno.create({
      data: {
        turmaId,
        alunoId
      },
      select: selecionarVinculoTurmaAluno
    });
  }

  /**
   * Reativa um vinculo antes excluido (limpa excluidoEm).
   *
   * @param id Id do vinculo turma-aluno.
   * @returns O vinculo reativado.
   */
  async reativarVinculoAluno(id: string): Promise<RespostaVinculoTurmaAluno> {
    return prisma.turmaAluno.update({
      where: { id },
      data: { excluidoEm: null },
      select: selecionarVinculoTurmaAluno
    });
  }

  /**
   * Soft delete do vinculo turma-aluno.
   *
   * @param id Id do vinculo.
   */
  async desvincularAluno(id: string): Promise<void> {
    await prisma.turmaAluno.update({
      where: { id },
      data: { excluidoEm: new Date() }
    });
  }
}
