import type { NextFunction, Request, Response } from 'express';

import type {
  AtualizarListaQuestaoDTO,
  CriarListaQuestaoDTO,
  FiltrosListaDTO,
  ReordenarQuestoesListaDTO,
  VincularQuestoesListaDTO,
  VincularTurmasListaDTO,
} from './dto/lista.types';
import type { ListaQuestaoService } from './lista.service';

export class ListaQuestaoController {
  constructor(private readonly service: ListaQuestaoService) {}

  criar = async (
    req: Request<unknown, unknown, CriarListaQuestaoDTO>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
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

  vincularTurmas = async (
    req: Request<{ id: string }, unknown, VincularTurmasListaDTO>,
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
}
