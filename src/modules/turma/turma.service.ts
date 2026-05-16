import type { TurmaRepository } from './turma.repository';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import type { FiltrosListagemTurma } from './dto/turma.types';

export class TurmaService {
  constructor(private readonly turmaRepository: TurmaRepository) {}

  async listar(filtros: FiltrosListagemTurma) {
    return this.turmaRepository.listarComFiltros(filtros);
  }

  async obterPorId(id: string, professorId: string) {
    const turma = await this.turmaRepository.buscarPorId(id);

    if (!turma) {
      throw new ErroAplicacao({
        codigo: 'NAO_ENCONTRADO',
        mensagem: 'Turma não encontrada.',
        codigoStatus: 404
      });
    }

    if (turma.professorId !== professorId) {
      throw new ErroAplicacao({
        codigo: 'PROIBIDO',
        mensagem: 'Você não tem permissão para acessar esta turma.',
        codigoStatus: 403
      });
    }

    return turma;
  }

  async deletar(id: string, professorId: string) {
    const turma = await this.obterPorId(id, professorId);
    await this.turmaRepository.deletarLogico(turma.id);
  }
}