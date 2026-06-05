import type { Request, Response, NextFunction } from 'express';
import type { ResolucaoListaService } from './resolucaoLista.service';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';

export class ResolucaoListaController {
  constructor(private readonly service: ResolucaoListaService) {}

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const alunoId = req.usuario?.id;
      
      if (!alunoId) {
        throw new ErroAplicacao({ 
          codigoStatus: 401, 
          codigo: 'NAO_AUTORIZADO', 
          mensagem: 'Usuário não autenticado.' 
        });
      }

      const status = req.query.status ? String(req.query.status) : undefined;
      const busca = req.query.busca ? String(req.query.busca) : undefined;

      const listas = await this.service.listarParaAluno(alunoId, status, busca);

      res.status(200).json({
        mensagem: "Listas recuperadas com sucesso.",
        dados: listas
      });
    } catch (erro) {
      next(erro);
    }
  }

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
}