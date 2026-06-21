import type { ResolucaoListaRepository } from './resolucaoLista.repository';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import type { AlternativaQuestao} from '@prisma/client';
import { StatusResolucaoLista } from '@prisma/client';
import type { QuestaoFormatadaDTO } from './dto/types';
import { gerarPdfBase64 } from '../../shared/utils/pdf.util';
import { prisma } from '@/config/db';

export class ResolucaoListaService {
  constructor(private readonly repository: ResolucaoListaRepository) {}

  async listarParaAluno(alunoId: string, turmaId?: string, filtroStatus?: string, busca?: string) {
    const listas = await this.repository.buscarListasDoAluno(alunoId, turmaId, busca);const agora = new Date();

    const mapeadas = listas.map(lista => {
      const resolucao = lista.resolucoes[0];
      let statusCalculado: 'PENDENTE' | 'RESPONDIDA' | 'EXPIRADA' = 'PENDENTE';

      if (resolucao?.status === StatusResolucaoLista.SUBMETIDA) {
        statusCalculado = 'RESPONDIDA';
      } else if (lista.prazo && lista.prazo < agora) {
        statusCalculado = 'EXPIRADA';
      }

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

  async registrarAutosave(alunoId: string, listaTurmaId: string, questaoId: string, alternativa: AlternativaQuestao) {
    const listaAtual = await this.repository.buscarListaComQuestoes(alunoId, listaTurmaId);

    if (!listaAtual) {
      throw new ErroAplicacao({ 
        codigoStatus: 404, 
        codigo: 'NAO_ENCONTRADO', 
        mensagem: 'Lista não encontrada ou você não pertence à turma.' 
      });
    }

    if (listaAtual.prazo && listaAtual.prazo < new Date()) {
      throw new ErroAplicacao({ 
        codigoStatus: 403, 
        codigo: 'PROIBIDO', 
        mensagem: 'O prazo para responder esta lista já expirou.' 
      });
    }

    if (listaAtual.resolucoes[0]?.status === StatusResolucaoLista.SUBMETIDA) {
      throw new ErroAplicacao({ 
        codigoStatus: 409, 
        codigo: 'CONFLITO', 
        mensagem: 'Esta lista já foi submetida.' 
      });
    }

    await this.repository.salvarResposta(alunoId, listaTurmaId, questaoId, alternativa);
  }

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