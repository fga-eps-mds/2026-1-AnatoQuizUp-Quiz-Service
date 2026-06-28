import type { ResolucaoListaRepository } from './resolucaoLista.repository';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import type { AlternativaQuestao} from '@prisma/client';
import { StatusResolucaoLista } from '@prisma/client';
import type { QuestaoFormatadaDTO } from './dto/types';
import { gerarPdfBase64 } from '../../shared/utils/pdf.util';
import { prisma } from '@/config/db';

/**
 * Service da resolucao de listas (visao do aluno).
 *
 * Cuida do ciclo do aluno respondendo uma lista: listar suas listas com status,
 * abrir o detalhe (escondendo o gabarito enquanto nao liberado), salvar respostas
 * (autosave), submeter e gerar o PDF da prova.
 */
export class ResolucaoListaService {
  constructor(private readonly repository: ResolucaoListaRepository) {}

  /**
   * Lista as listas disponiveis ao aluno, com status calculado e filtro opcional.
   *
   * Status: RESPONDIDA (submetida), EXPIRADA (prazo vencido) ou PENDENTE.
   *
   * @param alunoId Aluno dono das listas.
   * @param turmaId Filtra por turma (opcional).
   * @param filtroStatus Filtra pelo status calculado (opcional).
   * @param busca Termo de busca por nome (opcional).
   * @returns Listas mapeadas com status, temas e metadados.
   */
  async listarParaAluno(alunoId: string, turmaId?: string, filtroStatus?: string, busca?: string) {
    const listas = await this.repository.buscarListasDoAluno(alunoId, turmaId, busca);const agora = new Date();

    const mapeadas = listas.map(lista => {
      const resolucao = lista.resolucoes[0];
      // Deriva o status exibido: submetida -> RESPONDIDA; prazo vencido -> EXPIRADA.
      let statusCalculado: 'PENDENTE' | 'RESPONDIDA' | 'EXPIRADA' = 'PENDENTE';

      if (resolucao?.status === StatusResolucaoLista.SUBMETIDA) {
        statusCalculado = 'RESPONDIDA';
      } else if (lista.prazo && lista.prazo < agora) {
        statusCalculado = 'EXPIRADA';
      }

      // Conjunto de temas distintos presentes nas questoes da lista.
      const temasUnicos = Array.from(new Set(
        lista.listaQuestao.itens.map(item => item.questao.tema.nome)
      ));

      return {
        listaTurmaId: lista.id,
        nome: lista.listaQuestao.nome,
        temas: temasUnicos,
        quantidadeQuestoes: lista.listaQuestao.itens.length,
        prazo: lista.prazo,
        status: statusCalculado,
        gabaritoLiberado: lista.gabaritoLiberado
      };
    });

    if (filtroStatus) {
      return mapeadas.filter(l => l.status === filtroStatus);
    }
    return mapeadas;
  }

  /**
   * Abre o detalhe de uma lista para o aluno responder.
   *
   * Inclui as respostas ja salvas (autosave) por questao e so expoe gabarito/saiba
   * mais quando o professor liberou o gabarito.
   *
   * @param alunoId Aluno que abre a lista.
   * @param listaTurmaId Vinculo lista-turma.
   * @returns Cabecalho da lista + questoes formatadas (com/sem gabarito).
   * @throws ErroAplicacao 404 se a lista nao existir ou o aluno nao tiver acesso.
   */
  async buscarDetalhesDaLista(alunoId: string, listaTurmaId: string) {
    const lista = await this.repository.buscarListaComQuestoes(alunoId, listaTurmaId);

    if (!lista) {
      throw new ErroAplicacao({ 
        codigoStatus: 404, 
        codigo: 'NAO_ENCONTRADO', 
        mensagem: 'Lista não encontrada ou sem acesso.' 
      });
    }

    const resolucao = lista.resolucoes[0];
    const respostasMarcadas = resolucao?.respostas || [];

    const questoes = lista.listaQuestao.itens.map(item => {
      const q = item.questao;
      const respostaSalva = respostasMarcadas.find(r => r.questaoId === q.id);

      const questaoFormatada: QuestaoFormatadaDTO = {
        id: q.id,
        enunciado: q.enunciado,
        urlImagem: q.urlImagem,
        tema: q.tema.nome,
        tipoQuestao: q.tipoQuestao,
        alternativas: q.alternativas ? {
          A: q.alternativas.alternativaA,
          B: q.alternativas.alternativaB,
          C: q.alternativas.alternativaC,
          D: q.alternativas.alternativaD,
          E: q.alternativas.alternativaE,
        } : null,
        respostaMarcada: respostaSalva?.respostaMarcada || null,
      };

      // So revela gabarito e explicacao quando o professor liberou.
      if (lista.gabaritoLiberado) {
        questaoFormatada.respostaCorreta = q.respostaCorreta;
        questaoFormatada.saibaMais = q.saibaMais;
      }

      return questaoFormatada;
    });

    return {
      id: lista.id,
      nome: lista.listaQuestao.nome,
      prazo: lista.prazo,
      gabaritoLiberado: lista.gabaritoLiberado,
      status: resolucao?.status || 'EM_ANDAMENTO',
      questoes
    };
  }

  /**
   * Salva (autosave) a resposta de uma questao enquanto o aluno responde.
   *
   * Bloqueado se a lista nao existir/sem acesso (404), se o prazo expirou (403) ou se
   * a lista ja foi submetida (409).
   *
   * @param alunoId Aluno.
   * @param listaTurmaId Vinculo lista-turma.
   * @param questaoId Questao respondida.
   * @param alternativa Alternativa marcada.
   * @throws ErroAplicacao 404/403/409 conforme o estado da lista.
   */
  async registrarAutosave(alunoId: string, listaTurmaId: string, questaoId: string, alternativa: AlternativaQuestao) {
    const listaAtual = await this.repository.buscarListaComQuestoes(alunoId, listaTurmaId);

    if (!listaAtual) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: 'NAO_ENCONTRADO',
        mensagem: 'Lista não encontrada ou você não pertence à turma.'
      });
    }

    // Apos o prazo nao e mais possivel salvar respostas.
    if (listaAtual.prazo && listaAtual.prazo < new Date()) {
      throw new ErroAplicacao({ 
        codigoStatus: 403, 
        codigo: 'PROIBIDO', 
        mensagem: 'O prazo para responder esta lista já expirou.' 
      });
    }

    // Lista ja submetida nao aceita novas respostas.
    if (listaAtual.resolucoes[0]?.status === StatusResolucaoLista.SUBMETIDA) {
      throw new ErroAplicacao({
        codigoStatus: 409,
        codigo: 'CONFLITO',
        mensagem: 'Esta lista já foi submetida.'
      });
    }

    await this.repository.salvarResposta(alunoId, listaTurmaId, questaoId, alternativa);
  }

  /**
   * Submete a lista do aluno (encerra a resolucao).
   *
   * Exige acesso, prazo valido, que ainda nao tenha sido submetida e que exista ao
   * menos uma resolucao iniciada (pelo menos uma resposta salva).
   *
   * @param alunoId Aluno.
   * @param listaTurmaId Vinculo lista-turma.
   * @throws ErroAplicacao 404/403/409/400 conforme a regra violada.
   */
  async submeterLista(alunoId: string, listaTurmaId: string) {
    const listaAtual = await this.repository.buscarListaComQuestoes(alunoId, listaTurmaId);

    if (!listaAtual) {
      throw new ErroAplicacao({ codigoStatus: 404, codigo: 'NAO_ENCONTRADO', mensagem: 'Lista não encontrada ou você não pertence à turma.' });
    }

    if (listaAtual.prazo && listaAtual.prazo < new Date()) {
      throw new ErroAplicacao({ codigoStatus: 403, codigo: 'PROIBIDO', mensagem: 'O prazo para submeter esta lista já expirou.' });
    }

    const resolucao = listaAtual.resolucoes[0];
    
    if (resolucao?.status === StatusResolucaoLista.SUBMETIDA) {
      throw new ErroAplicacao({ codigoStatus: 409, codigo: 'CONFLITO', mensagem: 'Esta lista já foi submetida.' });
    }

    if (!resolucao) {
      throw new ErroAplicacao({ codigoStatus: 400, codigo: 'REQUISICAO_INVALIDA', mensagem: 'Você precisa responder pelo menos uma questão antes de submeter.' });
    }

    await this.repository.submeterLista(alunoId, listaTurmaId);
  }

  // Gera o PDF (template "prova") da lista para o aluno baixar/imprimir.
  async gerarPdfListaAluno(listaTurmaId: string): Promise<string> {
    const listaTurma = await prisma.listaTurma.findUnique({
      where: { id: listaTurmaId },
      include: {
        turma: true, 
        listaQuestao: {
          include: {
            itens: {
              include: {
                questao: {
                  include: {
                    alternativas: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!listaTurma) {
      throw new Error('Lista não encontrada na turma.');
    }

    const listaParaTemplate = listaTurma.listaQuestao;

    const professorEmail = 'Professor(a) Responsável';

    const pdfBase64 = await gerarPdfBase64('prova', { 
      lista: listaParaTemplate,
      professorEmail 
    });

    return pdfBase64;
  }
}