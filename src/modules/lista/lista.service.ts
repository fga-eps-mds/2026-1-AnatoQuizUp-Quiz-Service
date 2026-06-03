import { CodigoDeErro } from '@/shared/errors/codigos-de-erro';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import { gerarPdfBase64 } from '@/shared/utils/pdf.util';

import type {
  ListaQuestaoComDetalhes,
  ListaQuestaoRepository,
  ListaTurmaComResumo,
} from './lista.repository';
import type {
  AtualizarVinculoListaTurmaDTO,
  AtualizarListaQuestaoDTO,
  CriarListaQuestaoDTO,
  EstatisticasTurmaDTO,
  FiltrosListaDTO,
  ListaQuestaoRespostaDTO,
  ReordenarQuestoesListaDTO,
  VinculoListaTurmaDTO,
  VincularQuestoesListaDTO,
  VincularTurmasListaPayloadDTO,
} from './dto/lista.types';

export class ListaQuestaoService {
  constructor(private readonly repository: ListaQuestaoRepository) {}

  async criarLista(
    data: CriarListaQuestaoDTO,
    professorId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    const questoesIds = this.normalizarIds(data.questoesIds ?? [], 'questoesIds');
    const turmasIds = this.normalizarIds(data.turmasIds ?? [], 'turmasIds');

    await this.validarQuestoesAtivas(questoesIds);
    await this.validarTurmasAtivasDoProfessor(turmasIds, professorId);

    return this.repository.criar({
      nome: data.nome,
      criadoPorId: professorId,
      questoesIds,
      turmasIds,
    });
  }

  async atualizarLista(
    id: string,
    professorId: string,
    data: AtualizarListaQuestaoDTO,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    if (!data.nome) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.REQUISICAO_INVALIDA,
        codigoStatus: 400,
        mensagem: 'Informe o nome da lista para atualizar.',
      });
    }

    return this.repository.atualizarNome(lista.id, data.nome);
  }

  async buscarLista(id: string, professorId: string): Promise<ListaQuestaoComDetalhes> {
    return this.obterListaDoProfessor(id, professorId);
  }

  async listarMinhasListas(
    professorId: string,
    filtros?: FiltrosListaDTO,
  ): Promise<ListaQuestaoRespostaDTO[]> {
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

  async listarListasDaTurma(
    turmaId: string,
    professorId: string,
  ): Promise<ListaQuestaoComDetalhes[]> {
    await this.validarTurmasAtivasDoProfessor([turmaId], professorId);

    return this.repository.listarPorTurma(turmaId, professorId);
  }

  async listarVinculosDaTurma(
    turmaId: string,
    professorId: string,
  ): Promise<VinculoListaTurmaDTO[]> {
    await this.validarTurmasAtivasDoProfessor([turmaId], professorId);

    const vinculos = await this.repository.listarVinculosDaTurma(turmaId, professorId);

    return vinculos.map((vinculo) => this.mapearVinculoListaTurma(vinculo));
  }

  async deletarLista(id: string, professorId: string): Promise<void> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    await this.repository.deletar(lista.id);
  }

  async vincularQuestoes(
    id: string,
    professorId: string,
    data: VincularQuestoesListaDTO,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.obterListaDoProfessor(id, professorId);
    const questoesIds = this.normalizarIds(data.questoesIds, 'questoesIds');

    await this.validarQuestoesAtivas(questoesIds);
    this.validarQuestoesAindaNaoVinculadas(lista, questoesIds);

    const proximaOrdem = this.obterProximaOrdem(lista);

    return this.repository.vincularQuestoes(lista.id, questoesIds, proximaOrdem);
  }

  async desvincularQuestao(
    id: string,
    questaoId: string,
    professorId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    if (!lista.itens.some((item) => item.questaoId === questaoId)) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        codigoStatus: 404,
        mensagem: 'Questao nao vinculada a esta lista.',
      });
    }

    return this.repository.desvincularQuestao(lista.id, questaoId);
  }

  async reordenarQuestoes(
    id: string,
    professorId: string,
    data: ReordenarQuestoesListaDTO,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.obterListaDoProfessor(id, professorId);
    const questoesIds = this.normalizarIds(data.questoesIds, 'questoesIds');

    this.validarReordenacao(lista, questoesIds);

    return this.repository.reordenarQuestoes(lista.id, questoesIds);
  }

  async vincularTurmas(
    id: string,
    professorId: string,
    data: VincularTurmasListaPayloadDTO,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    if ('turmasIds' in data) {
      const turmasIds = this.normalizarIds(data.turmasIds, 'turmasIds');

      await this.validarTurmasAtivasDoProfessor(turmasIds, professorId);
      this.validarTurmasAindaNaoVinculadas(lista, turmasIds);

      return this.repository.vincularTurmas(lista.id, turmasIds);
    }

    const turmasIds = this.normalizarIds([data.turmaId], 'turmaId');

    await this.validarTurmasAtivasDoProfessor(turmasIds, professorId);
    this.validarTurmasAindaNaoVinculadas(lista, turmasIds);

    return this.repository.vincularTurmas(lista.id, [data]);
  }

  async atualizarVinculo(
    id: string,
    turmaId: string,
    professorId: string,
    data: AtualizarVinculoListaTurmaDTO,
  ): Promise<VinculoListaTurmaDTO> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    await this.validarTurmasAtivasDoProfessor([turmaId], professorId);

    if (!lista.turmas.some((vinculo) => vinculo.turmaId === turmaId)) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        codigoStatus: 404,
        mensagem: 'Turma nao vinculada a esta lista.',
      });
    }

    const vinculoAtualizado = await this.repository.atualizarVinculo(lista.id, turmaId, data);

    return this.mapearVinculoListaTurma(vinculoAtualizado);
  }

  async desvincularTurma(
    id: string,
    turmaId: string,
    professorId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    await this.validarTurmasAtivasDoProfessor([turmaId], professorId);

    if (!lista.turmas.some((vinculo) => vinculo.turmaId === turmaId)) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        codigoStatus: 404,
        mensagem: 'Turma nao vinculada a esta lista.',
      });
    }

    return this.repository.desvincularTurma(lista.id, turmaId);
  }

  async gerarEstatisticasTurma(
    listaId: string,
    turmaId: string,
    professorId: string,
  ): Promise<EstatisticasTurmaDTO> {
    const lista = await this.obterListaDoProfessor(listaId, professorId);

    await this.validarTurmasAtivasDoProfessor([turmaId], professorId);

    if (!lista.turmas.some((vinculo) => vinculo.turmaId === turmaId)) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        codigoStatus: 404,
        mensagem: 'Lista nao publicada nesta turma.',
      });
    }

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

  async gerarPdfLista(id: string, professorId: string, professorEmail: string): Promise<string> {
    const lista = await this.obterListaDoProfessor(id, professorId);
    
    return gerarPdfBase64('prova', { 
      lista, 
      professorEmail 
    });
  }

  private async obterListaDoProfessor(
    id: string,
    professorId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.repository.buscarPorId(id);

    if (!lista) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        codigoStatus: 404,
        mensagem: 'Lista de questoes nao encontrada.',
      });
    }

    if (lista.criadoPorId !== professorId) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.PROIBIDO,
        codigoStatus: 403,
        mensagem: 'Voce nao tem permissao para acessar esta lista.',
      });
    }

    return lista;
  }

  private normalizarIds(ids: string[], campo: string): string[] {
    const idsUnicos = [...new Set(ids)];

    if (idsUnicos.length !== ids.length) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.REQUISICAO_INVALIDA,
        codigoStatus: 400,
        mensagem: `Existem IDs duplicados em ${campo}.`,
      });
    }

    return idsUnicos;
  }

  private async validarQuestoesAtivas(questoesIds: string[]): Promise<void> {
    if (questoesIds.length === 0) return;

    const questoes = await this.repository.listarQuestoesAtivasPorIds(questoesIds);
    const questoesEncontradas = new Set(questoes.map((questao) => questao.id));
    const questoesNaoEncontradas = questoesIds.filter((questaoId) => !questoesEncontradas.has(questaoId));

    if (questoesNaoEncontradas.length > 0) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        codigoStatus: 404,
        mensagem: 'Uma ou mais questoes nao foram encontradas ou estao inativas.',
        detalhes: { questoesIds: questoesNaoEncontradas },
      });
    }
  }

  private async validarTurmasAtivasDoProfessor(
    turmasIds: string[],
    professorId: string,
  ): Promise<void> {
    if (turmasIds.length === 0) return;

    const turmas = await this.repository.listarTurmasAtivasDoProfessorPorIds(turmasIds, professorId);
    const turmasEncontradas = new Set(turmas.map((turma) => turma.id));
    const turmasNaoEncontradas = turmasIds.filter((turmaId) => !turmasEncontradas.has(turmaId));

    if (turmasNaoEncontradas.length > 0) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        codigoStatus: 404,
        mensagem: 'Uma ou mais turmas nao foram encontradas ou nao pertencem ao professor.',
        detalhes: { turmasIds: turmasNaoEncontradas },
      });
    }
  }

  private validarQuestoesAindaNaoVinculadas(
    lista: ListaQuestaoComDetalhes,
    questoesIds: string[],
  ): void {
    const questoesVinculadas = new Set(lista.itens.map((item) => item.questaoId));
    const questoesJaVinculadas = questoesIds.filter((questaoId) => questoesVinculadas.has(questaoId));

    if (questoesJaVinculadas.length > 0) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.CONFLITO,
        codigoStatus: 409,
        mensagem: 'Uma ou mais questoes ja estao vinculadas a esta lista.',
        detalhes: { questoesIds: questoesJaVinculadas },
      });
    }
  }

  private validarTurmasAindaNaoVinculadas(
    lista: ListaQuestaoComDetalhes,
    turmasIds: string[],
  ): void {
    const turmasVinculadas = new Set(lista.turmas.map((vinculo) => vinculo.turmaId));
    const turmasJaVinculadas = turmasIds.filter((turmaId) => turmasVinculadas.has(turmaId));

    if (turmasJaVinculadas.length > 0) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.CONFLITO,
        codigoStatus: 409,
        mensagem: 'Uma ou mais turmas ja estao vinculadas a esta lista.',
        detalhes: { turmasIds: turmasJaVinculadas },
      });
    }
  }

  private validarReordenacao(lista: ListaQuestaoComDetalhes, questoesIds: string[]): void {
    const questoesAtuais = new Set(lista.itens.map((item) => item.questaoId));
    const contemTodasQuestoes =
      questoesIds.length === questoesAtuais.size &&
      questoesIds.every((questaoId) => questoesAtuais.has(questaoId));

    if (!contemTodasQuestoes) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.REQUISICAO_INVALIDA,
        codigoStatus: 400,
        mensagem: 'A reordenacao deve conter exatamente as questoes atualmente vinculadas.',
      });
    }
  }

  private obterProximaOrdem(lista: ListaQuestaoComDetalhes): number {
    const maiorOrdem = Math.max(0, ...lista.itens.map((item) => item.ordem));

    return maiorOrdem + 1;
  }

  private mapearVinculoListaTurma(vinculo: ListaTurmaComResumo): VinculoListaTurmaDTO {
    return {
      id: vinculo.id,
      listaQuestaoId: vinculo.listaQuestaoId,
      nome: vinculo.listaQuestao.nome,
      quantidadeQuestoes: vinculo.listaQuestao._count.itens,
      prazo: vinculo.prazo,
      gabaritoLiberado: vinculo.gabaritoLiberado,
    };
  }
}
