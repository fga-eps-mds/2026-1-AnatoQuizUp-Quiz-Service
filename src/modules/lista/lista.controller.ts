import type { NextFunction, Request, Response } from 'express';

import type {
  AtualizarVinculoListaTurmaDTO,
  AtualizarListaQuestaoDTO,
  CriarListaQuestaoDTO,
  FiltrosListaDTO,
  ReordenarQuestoesListaDTO,
  VincularQuestoesListaDTO,
  VincularTurmasListaPayloadDTO,
} from './dto/lista.types';
import type { ListaQuestaoService } from './lista.service';

// Controller HTTP de listas de questoes (visao do professor). Extrai o professor do
// token, delega ao service e padroniza respostas; erros via next ao middleware central.
export class ListaQuestaoController {
  constructor(private readonly service: ListaQuestaoService) {}

  /**
   * POST cria uma lista de questoes para o professor autenticado.
   *
   * @param req Requisicao com os dados da lista no corpo.
   * @param res Resposta HTTP (201 com a lista criada).
   * @param next Repasse de erro ao middleware central.
   */
  criar = async (
    req: Request<unknown, unknown, CriarListaQuestaoDTO>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // O dono da lista e o professor autenticado.
      const professorId = req.usuario!.id;
      const lista = await this.service.criarLista(req.body, professorId);

      res.status(201).json({
        mensagem: 'Lista criada com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * PUT atualiza dados da lista (ex.: nome).
   *
   * @param req Requisicao com o id na rota e os campos a atualizar no corpo.
   * @param res Resposta HTTP (200 com a lista atualizada).
   * @param next Repasse de erro ao middleware central.
   */
  atualizar = async (
    req: Request<{ id: string }, unknown, AtualizarListaQuestaoDTO>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const lista = await this.service.atualizarLista(req.params.id, professorId, req.body);

      res.status(200).json({
        mensagem: 'Lista atualizada com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * GET detalhe de uma lista do professor.
   *
   * @param req Requisicao com o id da lista na rota.
   * @param res Resposta HTTP (200 com a lista).
   * @param next Repasse de erro ao middleware central.
   */
  buscar = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const professorId = req.usuario!.id;
      const lista = await this.service.buscarLista(req.params.id, professorId);

      res.status(200).json({
        mensagem: 'Lista recuperada com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * GET lista as listas do proprio professor, aplicando filtros opcionais.
   *
   * @param req Requisicao com filtros (busca/status) na query.
   * @param res Resposta HTTP (200 com as listas).
   * @param next Repasse de erro ao middleware central.
   */
  listarDoUsuario = async (
    req: Request<unknown, unknown, unknown, FiltrosListaDTO>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const listas = await this.service.listarMinhasListas(professorId, req.query);

      res.status(200).json({
        mensagem: 'Listas recuperadas com sucesso.',
        dados: listas,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * GET lista as listas publicadas em uma turma.
   *
   * @param req Requisicao com o turmaId na rota.
   * @param res Resposta HTTP (200 com as listas da turma).
   * @param next Repasse de erro ao middleware central.
   */
  listarPorTurma = async (req: Request<{ turmaId: string }>, res: Response, next: NextFunction) => {
    try {
      const professorId = req.usuario!.id;
      const listas = await this.service.listarListasDaTurma(req.params.turmaId, professorId);

      res.status(200).json({
        mensagem: 'Listas da turma recuperadas com sucesso.',
        dados: listas,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * GET lista os vinculos lista-turma (com prazos/gabarito) de uma turma.
   *
   * @param req Requisicao com o turmaId na rota.
   * @param res Resposta HTTP (200 com os vinculos).
   * @param next Repasse de erro ao middleware central.
   */
  listarVinculosDaTurma = async (
    req: Request<{ turmaId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const vinculos = await this.service.listarVinculosDaTurma(req.params.turmaId, professorId);

      res.status(200).json({
        mensagem: 'Vinculos da turma recuperados com sucesso.',
        dados: vinculos,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * DELETE remove (soft delete) uma lista do professor.
   *
   * @param req Requisicao com o id da lista na rota.
   * @param res Resposta HTTP (200 confirmando a remocao).
   * @param next Repasse de erro ao middleware central.
   */
  deletar = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const professorId = req.usuario!.id;

      await this.service.deletarLista(req.params.id, professorId);

      res.status(200).json({
        mensagem: 'Lista deletada com sucesso.',
        dados: null,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * POST vincula questoes a uma lista.
   *
   * @param req Requisicao com o id da lista na rota e os ids das questoes no corpo.
   * @param res Resposta HTTP (200 com a lista atualizada).
   * @param next Repasse de erro ao middleware central.
   */
  vincularQuestoes = async (
    req: Request<{ id: string }, unknown, VincularQuestoesListaDTO>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const lista = await this.service.vincularQuestoes(req.params.id, professorId, req.body);

      res.status(200).json({
        mensagem: 'Questoes vinculadas com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * DELETE remove uma questao da lista.
   *
   * @param req Requisicao com o id da lista e o questaoId na rota.
   * @param res Resposta HTTP (200 com a lista atualizada).
   * @param next Repasse de erro ao middleware central.
   */
  desvincularQuestao = async (
    req: Request<{ id: string; questaoId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const lista = await this.service.desvincularQuestao(
        req.params.id,
        req.params.questaoId,
        professorId,
      );

      res.status(200).json({
        mensagem: 'Questao desvinculada com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * PUT redefine a ordem das questoes da lista.
   *
   * @param req Requisicao com o id da lista na rota e a nova ordem dos ids no corpo.
   * @param res Resposta HTTP (200 com a lista reordenada).
   * @param next Repasse de erro ao middleware central.
   */
  reordenarQuestoes = async (
    req: Request<{ id: string }, unknown, ReordenarQuestoesListaDTO>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const lista = await this.service.reordenarQuestoes(req.params.id, professorId, req.body);

      res.status(200).json({
        mensagem: 'Questoes reordenadas com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * POST publica a lista em uma ou mais turmas.
   *
   * @param req Requisicao com o id da lista na rota e os vinculos de turma no corpo.
   * @param res Resposta HTTP (200 com a lista atualizada).
   * @param next Repasse de erro ao middleware central.
   */
  vincularTurmas = async (
    req: Request<{ id: string }, unknown, VincularTurmasListaPayloadDTO>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const lista = await this.service.vincularTurmas(req.params.id, professorId, req.body);

      res.status(200).json({
        mensagem: 'Turmas vinculadas com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * PATCH atualiza um vinculo lista-turma (prazo/gabarito).
   *
   * @param req Requisicao com id da lista e turmaId na rota e os campos no corpo.
   * @param res Resposta HTTP (200 com o vinculo atualizado).
   * @param next Repasse de erro ao middleware central.
   */
  atualizarVinculo = async (
    req: Request<{ id: string; turmaId: string }, unknown, AtualizarVinculoListaTurmaDTO>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const vinculo = await this.service.atualizarVinculo(
        req.params.id,
        req.params.turmaId,
        professorId,
        req.body,
      );

      res.status(200).json({
        mensagem: 'Vinculo atualizado com sucesso.',
        dados: vinculo,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * DELETE despublica a lista de uma turma.
   *
   * @param req Requisicao com id da lista e turmaId na rota.
   * @param res Resposta HTTP (200 com a lista atualizada).
   * @param next Repasse de erro ao middleware central.
   */
  desvincularTurma = async (
    req: Request<{ id: string; turmaId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const lista = await this.service.desvincularTurma(
        req.params.id,
        req.params.turmaId,
        professorId,
      );

      res.status(200).json({
        mensagem: 'Turma desvinculada com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * GET estatisticas de desempenho da turma na lista.
   *
   * @param req Requisicao com id da lista e turmaId na rota.
   * @param res Resposta HTTP (200 com as estatisticas).
   * @param next Repasse de erro ao middleware central.
   */
  estatisticas = async (
    req: Request<{ id: string; turmaId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professorId = req.usuario!.id;
      const estatisticas = await this.service.gerarEstatisticasTurma(
        req.params.id,
        req.params.turmaId,
        professorId,
      );

      res.status(200).json({
        mensagem: 'Estatisticas geradas com sucesso.',
        dados: estatisticas,
      });
    } catch (erro) {
      next(erro);
    }
  };

  /**
   * GET gera e devolve o PDF (base64) da lista para download.
   *
   * @param req Requisicao com o id da lista na rota (professor vem do token).
   * @param res Resposta HTTP (200 com o PDF em base64).
   * @param next Repasse de erro ao middleware central.
   */
  downloadPdf = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const professorId = req.usuario!.id;
    const professorEmail = req.usuario!.email;

    const pdfBase64 = await this.service.gerarPdfLista(req.params.id, professorId, professorEmail);

    res.status(200).json({ base64: pdfBase64 });
  } catch (erro) {
    next(erro);
  }
};
}
