import type { Request, Response, NextFunction } from 'express';
import type { ListaQuestaoService } from './lista.service';
import type { FiltrosListaDTO } from './dto/lista.types';

export class ListaQuestaoController {
  constructor(private readonly service: ListaQuestaoService) {}

  buscar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const lista = await this.service.buscarLista(id);
      
      res.status(200).json({
        mensagem: 'Lista recuperada com sucesso.',
        dados: lista,
      });
    } catch (erro) {
      next(erro);
    }
  };

  listarDoUsuario = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const professorId = req.usuario!.id;
      
      const filtros: FiltrosListaDTO = {
        busca: req.query.busca as string | undefined,
        status: req.query.status as 'PUBLICADA' | 'RASCUNHO' | undefined,
      };

      const listas = await this.service.listarMinhasListas(professorId, filtros);
      
      res.status(200).json({
        mensagem: 'Listas recuperadas com sucesso.',
        dados: listas,
      });
    } catch (erro) {
      next(erro);
    }
  };

  listarPorTurma = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const turmaId = req.params.turmaId as string;
      const listas = await this.service.listarListasDaTurma(turmaId);
      
      res.status(200).json({
        mensagem: 'Listas da turma recuperadas com sucesso.',
        dados: listas,
      });
    } catch (erro) {
      next(erro);
    }
  };

  deletar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const professorId = req.usuario!.id;
      
      await this.service.deletarLista(id, professorId);
      
      res.status(200).json({
        mensagem: 'Lista deletada com sucesso.',
        dados: null,
      });
    } catch (erro) {
      next(erro);
    }
  };

  estatisticas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, turmaId } = req.params as { id: string; turmaId: string };
      const estatisticas = await this.service.gerarEstatisticasTurma(id, turmaId);
      
      res.status(200).json({
        mensagem: 'Estatísticas geradas com sucesso.',
        dados: estatisticas,
      });
    } catch (erro) {
      next(erro);
    }
  };
}