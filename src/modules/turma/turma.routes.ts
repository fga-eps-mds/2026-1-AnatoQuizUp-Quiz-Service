import { Router } from 'express';
import { TurmaController } from './turma.controller';
import { TurmaService } from './turma.service';
import { TurmaRepository } from './turma.repository';
import { middlewareAutenticacao } from '@/shared/middlewares/autenticacao.middleware';
import { validarRequisicao } from '@/shared/middlewares/validacao.middleware';
import { schemaListarTurmas } from './turma.schemas';

const turmaRouter = Router();

const turmaRepository = new TurmaRepository();
const turmaService = new TurmaService(turmaRepository);
const turmaController = new TurmaController(turmaService);

turmaRouter.use(middlewareAutenticacao);

turmaRouter.get(
  '/', 
  validarRequisicao(schemaListarTurmas, 'query'), 
  turmaController.listar 
);

turmaRouter.get('/:id', turmaController.buscarPorId);

turmaRouter.delete('/:id', turmaController.deletar);

export { turmaRouter };