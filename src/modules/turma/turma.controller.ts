import type { Request, Response } from 'express';
import type { TurmaService } from './turma.service';
import type { StatusTurma } from '@prisma/client';

import type { Papel } from '@/shared/constants/papeis';
import type { UsuarioContexto } from './dto/turma.types';

// Request ja autenticada: garante a presenca de usuario (id + papel) injetado pelo middleware.
type RequestAutenticada = Request & {
  usuario: { id: string; papel: Papel };
};

/**
 * Extrai o contexto do usuario (id e papel) usado pelo service para regras de autorizacao.
 *
 * @param req Requisicao ja autenticada.
 * @returns Contexto com id e papel do usuario.
 */
function contextoDe(req: Request): UsuarioContexto {
  const { id, papel } = (req as RequestAutenticada).usuario;
  return { id, papel };
}

// Controller HTTP de turmas: CRUD e gestao de alunos vinculados.
// Repassa o contexto do usuario ao service, que decide o que cada papel pode fazer.
export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  /**
   * POST cria uma turma tendo o usuario logado como professor responsavel.
   *
   * @param req Requisicao com os dados da turma no corpo.
   * @param res Resposta HTTP (201 com a turma criada).
   */
  criar = async (req: Request, res: Response) => {
    const professorId = (req as RequestAutenticada).usuario.id;

    const turma = await this.turmaService.criar(req.body, professorId);

    return res.status(201).json({
      mensagem: 'Turma criada com sucesso.',
      dados: turma
    });
  };

  /**
   * GET lista turmas visiveis ao usuario, aplicando filtros opcionais da query.
   *
   * @param req Requisicao com filtros (status/busca/semestre/ano) na query.
   * @param res Resposta HTTP (200 com as turmas).
   */
  listar = async (req: Request, res: Response) => {
    const ctx = contextoDe(req);

    // Cada filtro so e considerado quando presente; ausencia vira undefined.
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

  /**
   * GET detalhes de uma turma especifica pelo id.
   *
   * @param req Requisicao com o id da turma na rota.
   * @param res Resposta HTTP (200 com a turma).
   */
  buscarPorId = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);

    const turma = await this.turmaService.obterPorId(id, ctx);

    return res.status(200).json({
      mensagem: 'Turma encontrada com sucesso.',
      dados: turma
    });
  };

  /**
   * PUT atualiza os dados de uma turma (sujeito a autorizacao no service).
   *
   * @param req Requisicao com o id na rota e os campos no corpo.
   * @param res Resposta HTTP (200 com a turma atualizada).
   */
  atualizar = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);

    const turma = await this.turmaService.atualizar(id, ctx, req.body);

    return res.status(200).json({
      mensagem: 'Turma atualizada com sucesso.',
      dados: turma
    });
  };

  /**
   * DELETE remove a turma; responde 204 sem corpo em caso de sucesso.
   *
   * @param req Requisicao com o id da turma na rota.
   * @param res Resposta HTTP (204 sem conteudo).
   */
  deletar = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);

    await this.turmaService.deletar(id, ctx);

    return res.status(204).send();
  };

  /**
   * GET lista os alunos vinculados a uma turma.
   *
   * @param req Requisicao com o id da turma na rota.
   * @param res Resposta HTTP (200 com os alunos).
   */
  listarAlunos = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ctx = contextoDe(req);

    const alunos = await this.turmaService.listarAlunos(id, ctx);

    return res.status(200).json({
      mensagem: 'Alunos vinculados listados com sucesso.',
      dados: alunos
    });
  };

  /**
   * POST vincula um aluno (alunoId no corpo) a uma turma existente.
   *
   * @param req Requisicao com o id da turma na rota e o alunoId no corpo.
   * @param res Resposta HTTP (201 com o vinculo criado).
   */
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

  /**
   * DELETE desvincula um aluno da turma (turma e aluno vem pelos params).
   *
   * @param req Requisicao com o id da turma e o alunoId na rota.
   * @param res Resposta HTTP (204 sem conteudo).
   */
  desvincularAluno = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const alunoId = req.params.alunoId as string;
    const ctx = contextoDe(req);

    await this.turmaService.desvincularAluno(id, ctx, alunoId);

    return res.status(204).send();
  };
}
