import type { TurmaRepository } from './turma.repository';
import { CodigoDeErro } from '@/shared/errors/codigos-de-erro';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import type { AtualizarTurmaDto, CriarTurmaDto, FiltrosListagemTurma } from './dto/turma.types';

export class TurmaService {
  constructor(private readonly turmaRepository: TurmaRepository) {}

  async listar(filtros: FiltrosListagemTurma) {
    return this.turmaRepository.listarComFiltros(filtros);
  }

  async criar(data: CriarTurmaDto, professorId: string) {
    await this.validarCodigoDisponivel(data.codigo);

    return this.turmaRepository.criar({
      ...data,
      professorId
    });
  }

  async atualizar(id: string, professorId: string, data: AtualizarTurmaDto) {
    const turma = await this.obterPorId(id, professorId);

    if (data.codigo && data.codigo !== turma.codigo) {
      await this.validarCodigoDisponivel(data.codigo);
    }

    return this.turmaRepository.atualizar(turma.id, data);
  }

  async obterPorId(id: string, professorId: string) {
    const turma = await this.turmaRepository.buscarPorId(id);

    if (!turma) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: 'Turma não encontrada.',
        codigoStatus: 404
      });
    }

    if (turma.professorId !== professorId) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.PROIBIDO,
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

  async listarAlunos(id: string, professorId: string) {
    const turma = await this.obterPorId(id, professorId);
    return this.turmaRepository.listarAlunos(turma.id);
  }

  async vincularAluno(id: string, professorId: string, alunoId: string) {
    const turma = await this.obterPorId(id, professorId);
    const vinculo = await this.turmaRepository.buscarVinculoAluno(turma.id, alunoId);

    if (!vinculo) {
      return this.turmaRepository.criarVinculoAluno(turma.id, alunoId);
    }

    if (!vinculo.excluidoEm) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.CONFLITO,
        mensagem: 'Aluno já vinculado à turma.',
        codigoStatus: 409
      });
    }

    return this.turmaRepository.reativarVinculoAluno(vinculo.id);
  }

  async desvincularAluno(id: string, professorId: string, alunoId: string) {
    const turma = await this.obterPorId(id, professorId);
    const vinculo = await this.turmaRepository.buscarVinculoAluno(turma.id, alunoId);

    if (!vinculo || vinculo.excluidoEm) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: 'Vínculo de aluno não encontrado.',
        codigoStatus: 404
      });
    }

    await this.turmaRepository.desvincularAluno(vinculo.id);
  }

  private async validarCodigoDisponivel(codigo: string) {
    const turmaExistente = await this.turmaRepository.buscarPorCodigo(codigo);

    if (turmaExistente) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.CONFLITO,
        mensagem: 'Já existe uma turma cadastrada com este código.',
        codigoStatus: 409
      });
    }
  }
}
