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
turmaRouter.use(middlewarePapeis(PAPEIS.PROFESSOR, PAPEIS.ADMINISTRADOR));

turmaRouter.post(
  '/',
  validarRequisicao(schemaCriarTurma),
  turmaController.criar
);

turmaRouter.get(
  '/', 
  validarRequisicao(schemaListarTurmas, 'query'), 
  turmaController.listar 
);

turmaRouter.get(
  '/:id/alunos',
  validarRequisicao(schemaParamsTurma, 'params'),
  turmaController.listarAlunos
);

turmaRouter.post(
  '/:id/alunos',
  validarRequisicao(schemaParamsTurma, 'params'),
  validarRequisicao(schemaVincularAlunoTurma),
  turmaController.vincularAluno
);

turmaRouter.delete(
  '/:id/alunos/:alunoId',
  validarRequisicao(schemaParamsTurmaAluno, 'params'),
  turmaController.desvincularAluno
);

turmaRouter.get(
  '/:id',
  validarRequisicao(schemaParamsTurma, 'params'),
  turmaController.buscarPorId
);

turmaRouter.patch(
  '/:id',
  validarRequisicao(schemaParamsTurma, 'params'),
  validarRequisicao(schemaAtualizarTurma),
  turmaController.atualizar
);

turmaRouter.delete(
  '/:id',
  validarRequisicao(schemaParamsTurma, 'params'),
  turmaController.deletar
);

export { turmaRouter };
