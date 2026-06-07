import type { Prisma } from '@prisma/client';

import { prisma } from '@/config/db';

import type { FiltrosListaDTO } from './dto/lista.types';

const incluirListaCompleta = {
  itens: {
    include: {
      questao: {
        include: {
          tema: true,
          alternativas: true,
        },
      },
    },
    orderBy: { ordem: 'asc' },
  },
  turmas: {
    include: { turma: true },
  },
} satisfies Prisma.ListaQuestaoInclude;

const incluirResumoLista = {
  _count: {
    select: { itens: true },
  },
  turmas: {
    include: { turma: true },
  },
} satisfies Prisma.ListaQuestaoInclude;

const incluirVinculoListaTurma = {
  listaQuestao: {
    include: {
      _count: {
        select: { itens: true },
      },
    },
  },
} satisfies Prisma.ListaTurmaInclude;

export type ListaQuestaoComDetalhes = Prisma.ListaQuestaoGetPayload<{
  include: typeof incluirListaCompleta;
}>;

export type ListaQuestaoResumo = Prisma.ListaQuestaoGetPayload<{
  include: typeof incluirResumoLista;
}>;

export type ListaTurmaComResumo = Prisma.ListaTurmaGetPayload<{
  include: typeof incluirVinculoListaTurma;
}>;

type CriarListaQuestaoRepositorioDTO = {
  nome: string;
  criadoPorId: string;
  questoesIds: string[];
  turmasIds: string[];
};

type VinculoTurmaListaRepositorioDTO = {
  turmaId: string;
  prazo?: string | Date | null;
  gabaritoLiberado?: boolean;
};

type AtualizarVinculoListaTurmaRepositorioDTO = {
  prazo?: string | Date | null;
  gabaritoLiberado?: boolean;
};

export class ListaQuestaoRepository {
  async buscarPorId(id: string): Promise<ListaQuestaoComDetalhes | null> {
    return prisma.listaQuestao.findFirst({
      where: { id, excluidoEm: null },
      include: incluirListaCompleta,
    });
  }

  async listarDoProfessor(
    professorId: string,
    filtros?: FiltrosListaDTO,
  ): Promise<ListaQuestaoResumo[]> {
    const where: Prisma.ListaQuestaoWhereInput = {
      criadoPorId: professorId,
      excluidoEm: null,
    };

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
      include: incluirResumoLista,
      orderBy: { criadoEm: 'desc' },
    });
  }

  async listarPorTurma(turmaId: string, professorId: string): Promise<ListaQuestaoComDetalhes[]> {
    return prisma.listaQuestao.findMany({
      where: {
        criadoPorId: professorId,
        excluidoEm: null,
        turmas: {
          some: { turmaId },
        },
      },
      include: incluirListaCompleta,
      orderBy: { criadoEm: 'desc' },
    });
  }

  async listarVinculosDaTurma(
    turmaId: string,
    professorId: string,
  ): Promise<ListaTurmaComResumo[]> {
    return prisma.listaTurma.findMany({
      where: {
        turmaId,
        listaQuestao: {
          criadoPorId: professorId,
          excluidoEm: null,
        },
      },
      include: incluirVinculoListaTurma,
      orderBy: { criadoEm: 'desc' },
    });
  }

  async criar(data: CriarListaQuestaoRepositorioDTO): Promise<ListaQuestaoComDetalhes> {
    return prisma.listaQuestao.create({
      data: {
        nome: data.nome,
        criadoPorId: data.criadoPorId,
        itens:
          data.questoesIds.length > 0
            ? {
                create: data.questoesIds.map((questaoId, index) => ({
                  questaoId,
                  ordem: index + 1,
                })),
              }
            : undefined,
        turmas:
          data.turmasIds.length > 0
            ? {
                create: data.turmasIds.map((turmaId) => ({
                  turmaId,
                })),
              }
            : undefined,
      },
      include: incluirListaCompleta,
    });
  }

  async atualizarNome(id: string, nome: string): Promise<ListaQuestaoComDetalhes> {
    return prisma.listaQuestao.update({
      where: { id },
      data: { nome },
      include: incluirListaCompleta,
    });
  }

  async deletar(id: string) {
    return prisma.listaQuestao.update({
      where: { id },
      data: { excluidoEm: new Date() },
    });
  }

  async listarQuestoesAtivasPorIds(ids: string[]) {
    return prisma.questao.findMany({
      where: {
        id: { in: ids },
        excluidoEm: null,
        status: 'ATIVO',
      },
      select: { id: true },
    });
  }

  async listarTurmasAtivasDoProfessorPorIds(ids: string[], professorId: string) {
    return prisma.turma.findMany({
      where: {
        id: { in: ids },
        professorId,
        excluidoEm: null,
        status: 'ATIVA',
      },
      select: { id: true },
    });
  }

  async vincularQuestoes(
    listaQuestaoId: string,
    questoesIds: string[],
    ordemInicial: number,
  ): Promise<ListaQuestaoComDetalhes> {
    await prisma.listaQuestaoItem.createMany({
      data: questoesIds.map((questaoId, index) => ({
        listaQuestaoId,
        questaoId,
        ordem: ordemInicial + index,
      })),
    });

    return this.buscarPorIdObrigatorio(listaQuestaoId);
  }

  async desvincularQuestao(
    listaQuestaoId: string,
    questaoId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    await prisma.$transaction(async (transacao) => {
      await transacao.listaQuestaoItem.deleteMany({
        where: { listaQuestaoId, questaoId },
      });

      const itensRestantes = await transacao.listaQuestaoItem.findMany({
        where: { listaQuestaoId },
        select: { id: true },
        orderBy: { ordem: 'asc' },
      });

      await Promise.all(
        itensRestantes.map((item, index) =>
          transacao.listaQuestaoItem.update({
            where: { id: item.id },
            data: { ordem: index + 1 },
          }),
        ),
      );
    });

    return this.buscarPorIdObrigatorio(listaQuestaoId);
  }

  async reordenarQuestoes(
    listaQuestaoId: string,
    questoesIds: string[],
  ): Promise<ListaQuestaoComDetalhes> {
    await prisma.$transaction(
      questoesIds.map((questaoId, index) =>
        prisma.listaQuestaoItem.update({
          where: {
            listaQuestaoId_questaoId: {
              listaQuestaoId,
              questaoId,
            },
          },
          data: { ordem: index + 1 },
        }),
      ),
    );

    return this.buscarPorIdObrigatorio(listaQuestaoId);
  }

  async vincularTurmas(
    listaQuestaoId: string,
    turmas: string[] | VinculoTurmaListaRepositorioDTO[],
  ): Promise<ListaQuestaoComDetalhes> {
    const vinculos = this.normalizarVinculosTurmas(turmas);

    await prisma.listaTurma.createMany({
      data: vinculos.map((vinculo) => {
        const dados: Prisma.ListaTurmaCreateManyInput = {
          listaQuestaoId,
          turmaId: vinculo.turmaId,
        };

        if (Object.prototype.hasOwnProperty.call(vinculo, 'prazo')) {
          dados.prazo = vinculo.prazo;
        }

        if (vinculo.gabaritoLiberado !== undefined) {
          dados.gabaritoLiberado = vinculo.gabaritoLiberado;
        }

        return dados;
      }),
    });

    return this.buscarPorIdObrigatorio(listaQuestaoId);
  }

  async atualizarVinculo(
    listaQuestaoId: string,
    turmaId: string,
    data: AtualizarVinculoListaTurmaRepositorioDTO,
  ): Promise<ListaTurmaComResumo> {
    const dados: Prisma.ListaTurmaUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(data, 'prazo')) {
      dados.prazo = data.prazo;
    }

    if (data.gabaritoLiberado !== undefined) {
      dados.gabaritoLiberado = data.gabaritoLiberado;
    }

    return prisma.listaTurma.update({
      where: {
        listaQuestaoId_turmaId: {
          listaQuestaoId,
          turmaId,
        },
      },
      data: dados,
      include: incluirVinculoListaTurma,
    });
  }

  async desvincularTurma(
    listaQuestaoId: string,
    turmaId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    await prisma.listaTurma.deleteMany({
      where: { listaQuestaoId, turmaId },
    });

    return this.buscarPorIdObrigatorio(listaQuestaoId);
  }

  async buscarEstatisticasTurma(listaId: string, turmaId: string) {
    const itens = await prisma.listaQuestaoItem.findMany({
      where: { listaQuestaoId: listaId },
      select: { questaoId: true },
    });
    const questoesIds = itens.map((i) => i.questaoId);

    const alunosTurma = await prisma.turmaAluno.findMany({
      where: { turmaId, excluidoEm: null },
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

  private async buscarPorIdObrigatorio(id: string): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.buscarPorId(id);

    if (!lista) {
      throw new Error('Lista de questoes nao encontrada apos operacao.');
    }

    return lista;
  }

  private normalizarVinculosTurmas(
    turmas: string[] | VinculoTurmaListaRepositorioDTO[],
  ): VinculoTurmaListaRepositorioDTO[] {
    return turmas.map((turma) => (typeof turma === 'string' ? { turmaId: turma } : turma));
  }
}
