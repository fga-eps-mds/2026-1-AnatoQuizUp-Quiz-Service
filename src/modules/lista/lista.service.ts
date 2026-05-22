import type { ListaQuestaoRepository } from './lista.repository';
import type { EstatisticasTurmaDTO, FiltrosListaDTO, ListaQuestaoRespostaDTO } from './dto/lista.types';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';

export class ListaQuestaoService {
  constructor(private readonly repository: ListaQuestaoRepository) {}

  async buscarLista(id: string) {
    const lista = await this.repository.buscarPorId(id);
    if (!lista) {
      throw new ErroAplicacao({
        codigo: 'NAO_ENCONTRADO',
        codigoStatus: 404,
        mensagem: 'Lista de questões não encontrada.',
      });
    }
    return lista;
  }

  async listarMinhasListas(professorId: string, filtros?: FiltrosListaDTO): Promise<ListaQuestaoRespostaDTO[]> {
    const listas = await this.repository.listarDoProfessor(professorId, filtros);

    return listas.map((lista) => ({
      id: lista.id,
      nome: lista.nome,
      quantidadeQuestoes: lista._count.itens,
      status: lista.turmas.length > 0 ? 'PUBLICADA' : 'RASCUNHO',
      turmas: lista.turmas.map((t) => ({
        id: t.turma.id,
        nome: t.turma.nome,
      })),
      criadoEm: lista.criadoEm,
      atualizadoEm: lista.atualizadoEm,
    }));
  }

  async listarListasDaTurma(turmaId: string) {
    return this.repository.listarPorTurma(turmaId);
  }

  async deletarLista(id: string, professorId: string) {
    const lista = await this.buscarLista(id);

    if (lista.criadoPorId !== professorId) {
      throw new ErroAplicacao({
        codigo: 'PROIBIDO',
        codigoStatus: 403,
        mensagem: 'Você não tem permissão para deletar esta lista.',
      });
    }

    await this.repository.deletar(id);
  }

  async gerarEstatisticasTurma(listaId: string, turmaId: string): Promise<EstatisticasTurmaDTO> {
    await this.buscarLista(listaId);

    const { alunosIds, resolucoes } = await this.repository.buscarEstatisticasTurma(listaId, turmaId);

    const estatisticasAlunos = alunosIds.map((alunoId) => {
      const respostasAluno = resolucoes.filter((r) => r.usuarioId === alunoId);
      
      let acertos = 0;
      let erros = 0;

      respostasAluno.forEach((resposta) => {
        if (resposta.respostaMarcada === resposta.questao.respostaCorreta) {
          acertos++;
        } else {
          erros++;
        }
      });

      const totalRespondidas = acertos + erros;
      const taxaAcerto = totalRespondidas > 0 ? (acertos / totalRespondidas) * 100 : 0;

      return {
        alunoId,
        totalRespondidas,
        acertos,
        erros,
        taxaAcerto: parseFloat(taxaAcerto.toFixed(2)),
      };
    });

    const alunosParticipantes = estatisticasAlunos.filter((est) => est.totalRespondidas > 0).length;

    return {
      turmaId,
      totalAlunos: alunosIds.length,
      alunosParticipantes,
      estatisticasAlunos,
    };
  }
}