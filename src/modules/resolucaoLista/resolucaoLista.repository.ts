import { prisma } from '@/config/db';
import type { AlternativaQuestao} from '@prisma/client';
import { StatusResolucaoLista } from '@prisma/client';

export class ResolucaoListaRepository {
  async buscarListasDoAluno(alunoId: string, busca?: string) {
    return prisma.listaTurma.findMany({
      where: {
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

  async salvarResposta(alunoId: string, listaTurmaId: string, questaoId: string, resposta: AlternativaQuestao) {
    const resolucaoLista = await prisma.resolucaoLista.upsert({
      where: { alunoId_listaTurmaId: { alunoId, listaTurmaId } },
      update: {},
      create: {
        alunoId,
        listaTurmaId,
        status: StatusResolucaoLista.EM_ANDAMENTO
      }
    });

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