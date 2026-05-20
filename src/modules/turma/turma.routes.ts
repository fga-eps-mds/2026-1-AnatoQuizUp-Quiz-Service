import { Router } from 'express';
import { TurmaController } from './turma.controller';
import { TurmaService } from './turma.service';
import { TurmaRepository } from './turma.repository';
import { PAPEIS } from '@/shared/constants/papeis';
import { middlewareAutenticacao } from '@/shared/middlewares/autenticacao.middleware';
import { middlewarePapeis } from '@/shared/middlewares/papeis.middleware';
import { validarRequisicao } from '@/shared/middlewares/validacao.middleware';
import {
  schemaAtualizarTurma,
  schemaCriarTurma,
  schemaListarTurmas,
  schemaParamsTurma,
  schemaParamsTurmaAluno,
  schemaVincularAlunoTurma
} from './turma.schemas';

const turmaRouter = Router();

const turmaRepository = new TurmaRepository();
const turmaService = new TurmaService(turmaRepository);
const turmaController = new TurmaController(turmaService);

turmaRouter.use(middlewareAutenticacao);

const apenasGestao = middlewarePapeis(PAPEIS.PROFESSOR, PAPEIS.ADMINISTRADOR);

// Rotas de leitura: abertas para ALUNO/PROFESSOR/ADMINISTRADOR.
// O service aplica filtros por papel (aluno ve so suas turmas vinculadas,
// professor ve so as que criou, admin ve todas).
turmaRouter.get(
  '/',
  validarRequisicao(schemaListarTurmas, 'query'),
  turmaController.listar
);

turmaRouter.get(
  '/:id',
  validarRequisicao(schemaParamsTurma, 'params'),
  turmaController.buscarPorId
);

// Rotas de gestao: restritas a PROFESSOR/ADMINISTRADOR.
turmaRouter.post(
  '/',
  apenasGestao,
  validarRequisicao(schemaCriarTurma),
  turmaController.criar
);

turmaRouter.get(
  '/:id/alunos',
  apenasGestao,
  validarRequisicao(schemaParamsTurma, 'params'),
  turmaController.listarAlunos
);

turmaRouter.post(
  '/:id/alunos',
  apenasGestao,
  validarRequisicao(schemaParamsTurma, 'params'),
  validarRequisicao(schemaVincularAlunoTurma),
  turmaController.vincularAluno
);

turmaRouter.delete(
  '/:id/alunos/:alunoId',
  apenasGestao,
  validarRequisicao(schemaParamsTurmaAluno, 'params'),
  turmaController.desvincularAluno
);

turmaRouter.patch(
  '/:id',
  apenasGestao,
  validarRequisicao(schemaParamsTurma, 'params'),
  validarRequisicao(schemaAtualizarTurma),
  turmaController.atualizar
);

turmaRouter.delete(
  '/:id',
  apenasGestao,
  validarRequisicao(schemaParamsTurma, 'params'),
  turmaController.deletar
);

export { turmaRouter };
