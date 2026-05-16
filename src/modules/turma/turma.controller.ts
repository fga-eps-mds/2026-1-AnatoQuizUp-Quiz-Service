import type { Request, Response } from 'express';
import type { TurmaService } from './turma.service';
import type { StatusTurma } from '@prisma/client';

export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  listar = async (req: Request, res: Response) => {
    const professorId = (req as Request & { usuario: { id: string } }).usuario.id;
    
    const status = req.query.status ? (req.query.status as StatusTurma) : undefined;
    const busca = req.query.busca ? (req.query.busca as string) : undefined;

    const turmas = await this.turmaService.listar({
      professorId,
      status,
      busca
    });

    return res.status(200).json({
      mensagem: 'Turmas listadas com sucesso.',
      dados: turmas
    });
  };

  buscarPorId = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    // Trocamos o 'any' aqui também
    const professorId = (req as Request & { usuario: { id: string } }).usuario.id;

    const turma = await this.turmaService.obterPorId(id, professorId);

    return res.status(200).json({
      mensagem: 'Turma encontrada com sucesso.',
      dados: turma
    });
  };

  deletar = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const professorId = (req as Request & { usuario: { id: string } }).usuario.id;

    await this.turmaService.deletar(id, professorId);

    return res.status(204).send(); 
  };
}