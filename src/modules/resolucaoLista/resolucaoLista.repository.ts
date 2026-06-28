import { prisma } from '@/config/db';
import type { AlternativaQuestao} from '@prisma/client';
import { StatusResolucaoLista } from '@prisma/client';

// Repository da resolucao de listas (Prisma): acesso as listas do aluno, suas
// respostas (autosave) e a submissao. So enxerga turmas ATIVAS em que o aluno tem vinculo.
export class ResolucaoListaRepository {
  /**
   * Lista as listas-turma disponiveis ao aluno (com filtro opcional de turma/nome),
   * incluindo questoes e a resolucao do proprio aluno.
   *
   * @param alunoId Id do aluno.
   * @param turmaId Filtro opcional por turma.
   * @param busca Filtro opcional pelo nome da lista.
   * @returns Listas-turma ordenadas por prazo, com questoes e resolucao do aluno.
   */
  async buscarListasDoAluno(alunoId: string, turmaId?: string, busca?: string) {
    return prisma.listaTurma.findMany({
      where: {
        turmaId: turmaId ? turmaId : undefined, 
        turma: {
          alunos: { some: { alunoId } },
          status: 'ATIVA'
        },
        listaQuestao: {
          nome: busca ? { contains: busca, mode: 'insensitive' } : undefined,
        }
      },
      include: {
        listaQuestao: {
          include: {
            itens: { include: { questao: { include: { tema: true } } } }
          }
        },
        resolucoes: {
          where: { alunoId }
        }
      },
      orderBy: { prazo: 'asc' }
    });
  }

  /**
   * Carrega uma lista-turma com questoes (ordenadas) e a resolucao/respostas do aluno.
   *
   * @param alunoId Id do aluno.
   * @param listaTurmaId Id da lista-turma a abrir.
   * @returns A lista-turma com questoes e a resolucao do aluno, ou null.
   */
  async buscarListaComQuestoes(alunoId: string, listaTurmaId: string) {
    return prisma.listaTurma.findFirst({
      where: {
        id: listaTurmaId,
        turma: {
          alunos: { some: { alunoId } },
          status: 'ATIVA'
        }
      },
      include: {
        listaQuestao: {
          include: {
            itens: {
              orderBy: { ordem: 'asc' },
              include: {
                questao: {
                  include: { alternativas: true, tema: true }
                }
              }
            }
          }
        },
        resolucoes: {
          where: { alunoId },
          include: { respostas: true }
        }
      }
    });
  }

  /**
   * Salva (upsert) a resposta de uma questao: garante a resolucao EM_ANDAMENTO e
   * grava/atualiza a alternativa marcada da questao.
   *
   * @param alunoId Id do aluno.
   * @param listaTurmaId Id da lista-turma.
   * @param questaoId Id da questao respondida.
   * @param resposta Alternativa marcada.
   * @returns A resposta da questao gravada/atualizada.
   */
  async salvarResposta(alunoId: string, listaTurmaId: string, questaoId: string, resposta: AlternativaQuestao) {
    // Garante a resolucao do aluno para a lista (cria como EM_ANDAMENTO se nao existir).
    const resolucaoLista = await prisma.resolucaoLista.upsert({
      where: { alunoId_listaTurmaId: { alunoId, listaTurmaId } },
      update: {},
      create: {
        alunoId,
        listaTurmaId,
        status: StatusResolucaoLista.EM_ANDAMENTO
      }
    });

    // Upsert da resposta da questao dentro dessa resolucao.
    return prisma.resolucaoQuestaoLista.upsert({
      where: { 
        resolucaoListaId_questaoId: { 
          resolucaoListaId: resolucaoLista.id, 
          questaoId 
        } 
      },
      update: { respostaMarcada: resposta },
      create: {
        resolucaoListaId: resolucaoLista.id,
        questaoId,
        respostaMarcada: resposta
      }
    });
  }

  /**
   * Marca a resolucao como SUBMETIDA e registra o horario da submissao.
   *
   * @param alunoId Id do aluno.
   * @param listaTurmaId Id da lista-turma submetida.
   * @returns A resolucao atualizada para SUBMETIDA.
   */
  async submeterLista(alunoId: string, listaTurmaId: string) {
    return prisma.resolucaoLista.update({
      where: { alunoId_listaTurmaId: { alunoId, listaTurmaId } },
      data: {
        status: StatusResolucaoLista.SUBMETIDA,
        submissaoEm: new Date()
      }
    });
  }
}