import type { Prisma } from '@prisma/client';

import { prisma } from '@/config/db';

import type { FiltrosListaDTO } from './dto/lista.types';

// Repository de listas de questoes (Prisma). Reune projecoes (include) reutilizaveis
// e os metodos de leitura/escrita; quase tudo respeita o soft delete (excluidoEm).

// Projecao completa: itens ordenados com a questao (tema/alternativas) e as turmas.
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

// Projecao de resumo: so a contagem de itens e as turmas (para a listagem).
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
  // Busca uma lista nao excluida pelo id, com a projecao completa.
  async buscarPorId(id: string): Promise<ListaQuestaoComDetalhes | null> {
    return prisma.listaQuestao.findFirst({
      where: { id, excluidoEm: null },
      include: incluirListaCompleta,
    });
  }

  // Lista as listas do professor (resumo), com filtro opcional por nome e status.
  async listarDoProfessor(
    professorId: string,
    filtros?: FiltrosListaDTO,
  ): Promise<ListaQuestaoResumo[]> {
    const where: Prisma.ListaQuestaoWhereInput = {
      criadoPorId: professorId,
      excluidoEm: null,
    };

    // Filtro textual por nome (case-insensitive).
    if (filtros?.busca) {
      where.nome = {
        contains: filtros.busca,
        mode: 'insensitive',
      };
    }

    // PUBLICADA = tem ao menos uma turma; RASCUNHO = nenhuma turma vinculada.
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

  // Lista (completa) as listas do professor publicadas em uma turma especifica.
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

  // Lista os vinculos lista-turma de uma turma (apenas das listas do professor).
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

  // Cria a lista ja criando, em cascata, os itens (com ordem) e os vinculos de turma.
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

  // Atualiza apenas o nome da lista.
  async atualizarNome(id: string, nome: string): Promise<ListaQuestaoComDetalhes> {
    return prisma.listaQuestao.update({
      where: { id },
      data: { nome },
      include: incluirListaCompleta,
    });
  }

  // Remove a lista via soft delete (marca excluidoEm).
  async deletar(id: string) {
    return prisma.listaQuestao.update({
      where: { id },
      data: { excluidoEm: new Date() },
    });
  }

  // Retorna os ids, dentre os informados, que correspondem a questoes ativas.
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

  // Retorna os ids, dentre os informados, que sao turmas ativas do professor.
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

  // Adiciona questoes a lista a partir de ordemInicial e recarrega a lista completa.
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

  // Remove a questao da lista e renumera a ordem das restantes, tudo numa transacao.
  async desvincularQuestao(
    listaQuestaoId: string,
    questaoId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    await prisma.$transaction(async (transacao) => {
      await transacao.listaQuestaoItem.deleteMany({
        where: { listaQuestaoId, questaoId },
      });

      // Recompacta a ordem (1..n) para nao deixar buracos apos a remocao.
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

  // Aplica a nova ordem: atribui ordem 1..n na sequencia dos ids recebidos (transacional).
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

  // Cria os vinculos lista-turma, aceitando ids simples ou objetos com prazo/gabarito.
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

        // So inclui prazo/gabarito quando informados, preservando os defaults do schema.
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

  // Atualiza prazo/gabarito de um vinculo lista-turma (so os campos informados).
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

  // Remove o vinculo da lista com a turma (despublica) e recarrega a lista.
  async desvincularTurma(
    listaQuestaoId: string,
    turmaId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    await prisma.listaTurma.deleteMany({
      where: { listaQuestaoId, turmaId },
    });

    return this.buscarPorIdObrigatorio(listaQuestaoId);
  }

  /**
   * Coleta os dados crus para as estatisticas da turma na lista.
   *
   * Retorna os alunos da turma e as resolucoes (com a questao) das questoes da lista;
   * a agregacao de acertos/erros e feita no service.
   *
   * @param listaId Lista avaliada.
   * @param turmaId Turma avaliada.
   * @returns Ids dos alunos da turma e suas resolucoes das questoes da lista.
   */
  async buscarEstatisticasTurma(listaId: string, turmaId: string) {
    // Questoes que compoem a lista.
    const itens = await prisma.listaQuestaoItem.findMany({
      where: { listaQuestaoId: listaId },
      select: { questaoId: true },
    });
    const questoesIds = itens.map((i) => i.questaoId);

    // Alunos atualmente matriculados na turma.
    const alunosTurma = await prisma.turmaAluno.findMany({
      where: { turmaId, excluidoEm: null },
      select: { alunoId: true },
    });
    const alunosIds = alunosTurma.map((a) => a.alunoId);

    // Resolucoes desses alunos para as questoes da lista (com a questao p/ o gabarito).
    const resolucoes = await prisma.resolucaoQuestao.findMany({
      where: {
        questaoId: { in: questoesIds },
        usuarioId: { in: alunosIds },
      },
      include: { questao: true },
    });

    return { alunosIds, resolucoes };
  }

  // Recarrega a lista apos uma operacao; lanca se sumiu (estado inesperado).
  private async buscarPorIdObrigatorio(id: string): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.buscarPorId(id);

    if (!lista) {
      throw new Error('Lista de questoes nao encontrada apos operacao.');
    }

    return lista;
  }

  // Uniformiza a entrada de turmas (ids simples ou objetos) em vinculos detalhados.
  private normalizarVinculosTurmas(
    turmas: string[] | VinculoTurmaListaRepositorioDTO[],
  ): VinculoTurmaListaRepositorioDTO[] {
    return turmas.map((turma) => (typeof turma === 'string' ? { turmaId: turma } : turma));
  }
}
