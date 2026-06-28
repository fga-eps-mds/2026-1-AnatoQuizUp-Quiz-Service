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

/**
 * Service de listas de questoes.
 *
 * Concentra as regras do professor sobre listas: criar/editar, vincular questoes e
 * turmas, reordenar, gerar estatisticas e PDF. Toda operacao confere a posse da lista
 * e o vinculo do professor com as turmas antes de delegar a persistencia ao repository.
 */
export class ListaQuestaoService {
  constructor(private readonly repository: ListaQuestaoRepository) {}

  /**
   * Cria uma lista de questoes do professor, opcionalmente ja vinculada a turmas.
   *
   * Normaliza e valida os ids (questoes ativas; turmas ativas do proprio professor)
   * antes de persistir.
   *
   * @param data Nome e ids de questoes/turmas iniciais.
   * @param professorId Dono da lista.
   * @returns A lista criada com seus detalhes.
   */
  async criarLista(
    data: CriarListaQuestaoDTO,
    professorId: string,
  ): Promise<ListaQuestaoComDetalhes> {
    const questoesIds = this.normalizarIds(data.questoesIds ?? [], 'questoesIds');
    const turmasIds = this.normalizarIds(data.turmasIds ?? [], 'turmasIds');

    // Garante que as questoes existem/ativas e que as turmas sao do professor.
    await this.validarQuestoesAtivas(questoesIds);
    await this.validarTurmasAtivasDoProfessor(turmasIds, professorId);

    return this.repository.criar({
      nome: data.nome,
      criadoPorId: professorId,
      questoesIds,
      turmasIds,
    });
  }

  // Atualiza o nome da lista (exige posse e que um nome seja informado).
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

  // Busca uma lista do professor pelo id (com seus detalhes).
  async buscarLista(id: string, professorId: string): Promise<ListaQuestaoComDetalhes> {
    return this.obterListaDoProfessor(id, professorId);
  }

  // Lista as listas do professor em formato de resumo (para a tela de listagem).
  async listarMinhasListas(
    professorId: string,
    filtros?: FiltrosListaDTO,
  ): Promise<ListaQuestaoRespostaDTO[]> {
    const listas = await this.repository.listarDoProfessor(professorId, filtros);

    return listas.map((lista) => ({
      id: lista.id,
      nome: lista.nome,
      quantidadeQuestoes: lista._count.itens,
      // Lista com ao menos uma turma vinculada e considerada PUBLICADA; senao, RASCUNHO.
      status: lista.turmas.length > 0 ? 'PUBLICADA' : 'RASCUNHO',
      turmas: lista.turmas.map((t) => ({
        id: t.turma.id,
        nome: t.turma.nome,
      })),
      criadoEm: lista.criadoEm,
      atualizadoEm: lista.atualizadoEm,
    }));
  }

  // Lista as listas publicadas em uma turma (visao do professor dono da turma).
  async listarListasDaTurma(
    turmaId: string,
    professorId: string,
  ): Promise<ListaQuestaoComDetalhes[]> {
    await this.validarTurmasAtivasDoProfessor([turmaId], professorId);

    return this.repository.listarPorTurma(turmaId, professorId);
  }

  // Lista os vinculos lista-turma (com datas de disponibilidade) de uma turma.
  async listarVinculosDaTurma(
    turmaId: string,
    professorId: string,
  ): Promise<VinculoListaTurmaDTO[]> {
    await this.validarTurmasAtivasDoProfessor([turmaId], professorId);

    const vinculos = await this.repository.listarVinculosDaTurma(turmaId, professorId);

    return vinculos.map((vinculo) => this.mapearVinculoListaTurma(vinculo));
  }

  // Remove uma lista do professor (exige posse).
  async deletarLista(id: string, professorId: string): Promise<void> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    await this.repository.deletar(lista.id);
  }

  // Vincula questoes a uma lista, ao final da ordem atual, sem duplicar as ja vinculadas.
  async vincularQuestoes(
    id: string,
    professorId: string,
    data: VincularQuestoesListaDTO,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.obterListaDoProfessor(id, professorId);
    const questoesIds = this.normalizarIds(data.questoesIds, 'questoesIds');

    await this.validarQuestoesAtivas(questoesIds);
    this.validarQuestoesAindaNaoVinculadas(lista, questoesIds);

    // Continua a numeracao de ordem a partir da ultima questao ja vinculada.
    const proximaOrdem = this.obterProximaOrdem(lista);

    return this.repository.vincularQuestoes(lista.id, questoesIds, proximaOrdem);
  }

  // Remove uma questao da lista (404 se ela nao estiver vinculada).
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

  // Redefine a ordem das questoes da lista (a nova ordem deve conter exatamente as mesmas).
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

  // Publica a lista em turmas. Aceita dois formatos de payload: lista de ids
  // (turmasIds) ou um unico vinculo detalhado (turmaId + datas de disponibilidade).
  async vincularTurmas(
    id: string,
    professorId: string,
    data: VincularTurmasListaPayloadDTO,
  ): Promise<ListaQuestaoComDetalhes> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    // Formato 1: varias turmas por id.
    if ('turmasIds' in data) {
      const turmasIds = this.normalizarIds(data.turmasIds, 'turmasIds');

      await this.validarTurmasAtivasDoProfessor(turmasIds, professorId);
      this.validarTurmasAindaNaoVinculadas(lista, turmasIds);

      return this.repository.vincularTurmas(lista.id, turmasIds);
    }

    // Formato 2: um unico vinculo detalhado (com datas), repassado como objeto.
    const turmasIds = this.normalizarIds([data.turmaId], 'turmaId');

    await this.validarTurmasAtivasDoProfessor(turmasIds, professorId);
    this.validarTurmasAindaNaoVinculadas(lista, turmasIds);

    return this.repository.vincularTurmas(lista.id, [data]);
  }

  // Atualiza um vinculo lista-turma (ex.: datas de disponibilidade); 404 se nao vinculada.
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

  // Despublica a lista de uma turma (remove o vinculo); 404 se nao vinculada.
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

  /**
   * Gera as estatisticas de desempenho de uma turma em uma lista publicada.
   *
   * Exige posse da lista e que ela esteja publicada na turma. Calcula, por aluno,
   * acertos/erros a partir das resolucoes registradas.
   *
   * @param listaId Lista avaliada.
   * @param turmaId Turma avaliada.
   * @param professorId Dono da lista.
   * @returns Estatisticas agregadas da turma na lista.
   * @throws ErroAplicacao 404 se a lista nao estiver publicada na turma.
   */
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

    // Para cada aluno, agrega acertos/erros a partir das suas resolucoes.
    const estatisticasAlunos = alunosIds.map((alunoId) => {
      const respostasAluno = resolucoes.filter((r) => r.usuarioId === alunoId);

      let acertos = 0;
      let erros = 0;

      // Acerto = resposta marcada igual ao gabarito da questao.
      respostasAluno.forEach((resposta) => {
        if (resposta.respostaMarcada === resposta.questao.respostaCorreta) {
          acertos++;
        } else {
          erros++;
        }
      });

      // Taxa de acerto em %, protegida contra divisao por zero.
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

  // Gera o PDF da lista (template "prova") em base64, para download/impressao.
  async gerarPdfLista(id: string, professorId: string, professorEmail: string): Promise<string> {
    const lista = await this.obterListaDoProfessor(id, professorId);

    return gerarPdfBase64('prova', {
      lista,
      professorEmail
    });
  }

  /**
   * Carrega uma lista garantindo que ela existe e pertence ao professor.
   *
   * Centraliza o controle de acesso reutilizado por quase todos os metodos.
   *
   * @param id Id da lista.
   * @param professorId Professor que deve ser o dono.
   * @returns A lista com seus detalhes.
   * @throws ErroAplicacao 404 se nao existir; 403 se nao for do professor.
   */
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

    // So o dono pode acessar/alterar a lista.
    if (lista.criadoPorId !== professorId) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.PROIBIDO,
        codigoStatus: 403,
        mensagem: 'Voce nao tem permissao para acessar esta lista.',
      });
    }

    return lista;
  }

  // Remove duplicatas dos ids; se havia duplicado, rejeita a requisicao (400).
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

  // Garante que todas as questoes informadas existem e estao ativas (senao 404).
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

  // Garante que todas as turmas existem, estao ativas e pertencem ao professor (senao 404).
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

  // Impede vincular novamente questoes que ja estao na lista (conflito 409).
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

  // Impede publicar a lista numa turma onde ela ja esta vinculada (conflito 409).
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

  // A reordenacao deve conter exatamente o mesmo conjunto de questoes ja vinculadas.
  private validarReordenacao(lista: ListaQuestaoComDetalhes, questoesIds: string[]): void {
    const questoesAtuais = new Set(lista.itens.map((item) => item.questaoId));
    // Mesmo tamanho e mesmos elementos => e uma permutacao valida das questoes atuais.
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

  // Calcula a proxima posicao de ordem (maior ordem atual + 1; 1 quando vazia).
  private obterProximaOrdem(lista: ListaQuestaoComDetalhes): number {
    const maiorOrdem = Math.max(0, ...lista.itens.map((item) => item.ordem));

    return maiorOrdem + 1;
  }

  // Converte o vinculo lista-turma do banco no DTO de resposta.
  private mapearVinculoListaTurma(vinculo: ListaTurmaComResumo): VinculoListaTurmaDTO {
    return {
      id: vinculo.id,
      listaQuestaoId: vinculo.listaQuestaoId,
      nome: vinculo.listaQuestao.nome,
      quantidadeQuestoes: vinculo.listaQuestao._count.itens,
      prazo: vinculo.prazo?.toISOString() ?? null,
      gabaritoLiberado: vinculo.gabaritoLiberado,
    };
  }
}
