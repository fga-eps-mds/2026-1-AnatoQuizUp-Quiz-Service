import type { Request, Response } from 'express';
import type { TurmaService } from './turma.service';
import type { StatusTurma } from '@prisma/client';

import type { Papel } from '@/shared/constants/papeis';
import type { UsuarioContexto } from './dto/turma.types';

type RequestAutenticada = Request & {
  usuario: { id: string; papel: Papel };
};

function contextoDe(req: Request): UsuarioContexto {
  const { id, papel } = (req as RequestAutenticada).usuario;
  return { id, papel };
}

export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  criar = async (req: Request, res: Response) => {
    const professorId = (req as RequestAutenticada).usuario.id;

    const turma = await this.turmaService.criar(req.body, professorId);

    return res.status(201).json({
      mensagem: 'Turma criada com sucesso.',
      dados: turma
    });
  };

  listar = async (req: Request, res: Response) => {
    const ctx = contextoDe(req);

    const status = req.query.status ? (req.query.status as StatusTurma) : undefined;
    const busca = req.query.busca ? (req.query.busca as string) : undefined;
    const semestre = req.query.semestre ? (req.query.semestre as string) : undefined;
    const ano = req.query.ano !== undefined ? Number(req.query.ano) : undefined;

    const turmas = await this.turmaService.listar(ctx, {
      status,
      busca,
      semestre,
      ano
    });

    return res.status(200).json({
      mensagem: 'Turmas listadas com sucesso.',
      dados: turmas
    });
  };

  buscarPorId = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);

    const turma = await this.turmaService.obterPorId(id, ctx);

    return res.status(200).json({
      mensagem: 'Turma encontrada com sucesso.',
      dados: turma
    });
  };

  atualizar = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);

    const turma = await this.turmaService.atualizar(id, ctx, req.body);

    return res.status(200).json({
      mensagem: 'Turma atualizada com sucesso.',
      dados: turma
    });
  };

  deletar = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);

    await this.turmaService.deletar(id, ctx);

    return res.status(204).send();
  };

  listarAlunos = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);

    const alunos = await this.turmaService.listarAlunos(id, ctx);

    return res.status(200).json({
      mensagem: 'Alunos vinculados listados com sucesso.',
      dados: alunos
    });
  };

  vincularAluno = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);
    const alunoId = req.body.alunoId as string;

    const vinculo = await this.turmaService.vincularAluno(id, ctx, alunoId);

    return res.status(201).json({
      mensagem: 'Aluno vinculado à turma com sucesso.',
      dados: vinculo
    });
  };

  desvincularAluno = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const alunoId = req.params.alunoId as string;
    const ctx = contextoDe(req);

    await this.turmaService.desvincularAluno(id, ctx, alunoId);

    return res.status(204).send();
  };
}
