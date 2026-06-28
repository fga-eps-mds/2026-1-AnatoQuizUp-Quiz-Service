import type { Request, Response, NextFunction } from 'express';
import type { ResolucaoListaService } from './resolucaoLista.service';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';

// Controller HTTP da resolucao de listas pelo aluno: listagem, detalhe, autosave e submissao.
// Todas as rotas exigem aluno autenticado; sem usuario na request retorna 401.
export class ResolucaoListaController {
  constructor(private readonly service: ResolucaoListaService) {}

  /**
   * GET listas atribuidas ao aluno, com filtros opcionais de status, busca e turma.
   *
   * @param req Requisicao com filtros na query (aluno vem do token).
   * @param res Resposta HTTP (200 com as listas).
   * @param next Repasse de erro ao middleware central.
   */
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const alunoId = req.usuario?.id;

      // Guarda de autenticacao: sem id de aluno nao ha o que listar.
      if (!alunoId) {
        throw new ErroAplicacao({
          codigoStatus: 401,
          codigo: 'NAO_AUTORIZADO',
          mensagem: 'Usuário não autenticado.'
        });
      }

      // Filtros opcionais: so viram string quando presentes na query.
      const status = req.query.status ? String(req.query.status) : undefined;
      const busca = req.query.busca ? String(req.query.busca) : undefined;
      const turmaId = req.query.turmaId ? String(req.query.turmaId) : undefined;

      const listas = await this.service.listarParaAluno(alunoId, turmaId, status, busca);

      res.status(200).json({
        mensagem: "Listas recuperadas com sucesso.",
        dados: listas
      });
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * GET detalhes de uma lista especifica para resolucao (questoes + progresso salvo).
   *
   * @param req Requisicao com o id da lista na rota (aluno vem do token).
   * @param res Resposta HTTP (200 com os detalhes da lista).
   * @param next Repasse de erro ao middleware central.
   */
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const alunoId = req.usuario?.id;

      if (!alunoId) {
        throw new ErroAplicacao({
          codigoStatus: 401,
          codigo: 'NAO_AUTORIZADO',
          mensagem: 'Usuário não autenticado.'
        });
      }

      // Id da lista-turma vem na rota; identifica qual atribuicao o aluno abriu.
      const listaTurmaId = String(req.params.id);

      const detalhes = await this.service.buscarDetalhesDaLista(alunoId, listaTurmaId);

      res.status(200).json({
        mensagem: "Detalhes da lista recuperados com sucesso.",
        dados: detalhes
      });
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * POST salva automaticamente a alternativa marcada em uma questao, sem submeter a lista.
   *
   * @param req Requisicao com a lista na rota e questao/alternativa no corpo.
   * @param res Resposta HTTP (200 confirmando o autosave).
   * @param next Repasse de erro ao middleware central.
   */
  async autosave(req: Request, res: Response, next: NextFunction) {
    try {
      const alunoId = req.usuario?.id;

      if (!alunoId) {
        throw new ErroAplicacao({
          codigoStatus: 401,
          codigo: 'NAO_AUTORIZADO',
          mensagem: 'Usuário não autenticado.'
        });
      }

      // Identifica a lista e a questao; a alternativa pode vir nula (desmarcar).
      const listaTurmaId = String(req.params.id);
      const questaoId = String(req.body.questaoId);

      const alternativaMarcada = req.body.alternativaMarcada;

      await this.service.registrarAutosave(alunoId, listaTurmaId, questaoId, alternativaMarcada);

      res.status(200).json({
        mensagem: "Progresso salvo automaticamente.",
        dados: null
      });
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * POST submete definitivamente a lista: corrige, pontua e encerra a resolucao do aluno.
   *
   * @param req Requisicao com o id da lista na rota (aluno vem do token).
   * @param res Resposta HTTP (200 confirmando a submissao).
   * @param next Repasse de erro ao middleware central.
   */
  async submeter(req: Request, res: Response, next: NextFunction) {
    try {
      const alunoId = req.usuario?.id;

      if (!alunoId) {
        throw new ErroAplicacao({
          codigoStatus: 401,
          codigo: 'NAO_AUTORIZADO',
          mensagem: 'Usuário não autenticado.'
        });
      }

      const listaTurmaId = String(req.params.id);

      await this.service.submeterLista(alunoId, listaTurmaId);

      res.status(200).json({
        mensagem: "Lista submetida com sucesso!",
        dados: null
      });
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * GET gera o PDF da lista resolvida pelo aluno e devolve o conteudo em base64.
   *
   * @param req Requisicao com o listaTurmaId na rota.
   * @param res Resposta HTTP (200 com o PDF em base64).
   * @param next Repasse de erro ao middleware central.
   */
  downloadPdf = async (req: Request<{ listaTurmaId: string }>, res: Response, next: NextFunction) => {
    try {
      const { listaTurmaId } = req.params;

      // PDF e retornado como string base64 para o front baixar/abrir.
      const pdfBase64 = await this.service.gerarPdfListaAluno(listaTurmaId);

      res.status(200).json({ base64: pdfBase64 });
    } catch (erro) {
      next(erro);
    }
  };
}
