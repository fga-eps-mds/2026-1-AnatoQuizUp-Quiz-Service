import type { Request, Response } from 'express';
import type { TurmaDashboardService } from './dashboardTurma.service';

export class TurmaDashboardController {
  constructor(private readonly service: TurmaDashboardService) {}

  listarMacro = async (req: Request, res: Response) => {
    try {
      const turmaId = req.params.id as string;

      const professorId = req.usuario?.id;

      if (!professorId) {
        return res.status(401).json({ error: 'Usuário não autenticado ou sessão expirada.' });
      }

      const dashboardData = await this.service.getMacroDashboard(turmaId, professorId);

      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error('Erro no TurmaDashboardController:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados do dashboard da turma.' });
    }
  };

  listarIndividual = async (req: Request, res: Response) => {
    try {
      const turmaId = req.params.id as string;

      if (!req.usuario?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado ou sessão expirada.' });
      }

      const data = await this.service.getDesempenhoIndividual(turmaId);

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro no TurmaDashboardController [individual]:', error);
      return res.status(500).json({ error: 'Erro ao buscar desempenho individual.' });
    }
  };

  listarPorListas = async (req: Request, res: Response) => {
    try {
      const turmaId = req.params.id as string;
      const professorId = req.usuario?.id;

      if (!professorId) {
        return res.status(401).json({ error: 'UsuÃ¡rio nÃ£o autenticado ou sessÃ£o expirada.' });
      }

      const data = await this.service.getDesempenhoPorListas(turmaId, professorId);

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro no TurmaDashboardController [listas]:', error);
      return res.status(500).json({ error: 'Erro ao buscar desempenho por lista.' });
    }
  };

  listarDesempenhoListaIndividual = async (req: Request, res: Response) => {
    try {
      const turmaId = req.params.id as string;
      const listaTurmaId = req.params.listaId as string;
      const professorId = req.usuario?.id;

      if (!professorId) {
        return res.status(401).json({ error: 'Usuário não autenticado ou sessão expirada.' });
      }

      const data = await this.service.getDesempenhoAlunosNaLista(turmaId, listaTurmaId);

      return res.status(200).json(data);
    } catch (error: unknown) {
      console.error('Erro no TurmaDashboardController [lista individual]:', error);
      
      console.error('Erro no TurmaDashboardController [lista individual]:', error);
      
      // Verificamos se é uma instância de Error antes de acessar a propriedade .message
      if (error instanceof Error && error.message === 'Lista não encontrada ou não pertence a esta turma.') {
        return res.status(404).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'Erro ao buscar desempenho dos alunos na lista.' });
    }
  };
}
