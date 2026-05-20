import type { TurmaRepository } from './turma.repository';
import { PAPEIS } from '@/shared/constants/papeis';
import { CodigoDeErro } from '@/shared/errors/codigos-de-erro';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import type {
  AtualizarTurmaDto,
  CriarTurmaDto,
  FiltrosListagemTurma,
  UsuarioContexto
} from './dto/turma.types';

export class TurmaService {
  constructor(private readonly turmaRepository: TurmaRepository) {}

  async listar(ctx: UsuarioContexto, filtros: FiltrosListagemTurma) {
    if (ctx.papel === PAPEIS.ALUNO) {
      // Aluno: somente turmas ATIVAS onde ele esta vinculado.
      // Filtros legitimos: busca, semestre, ano. status do query e ignorado.
      return this.turmaRepository.listarPorAluno(ctx.id, {
        busca: filtros.busca,
        semestre: filtros.semestre,
        ano: filtros.ano
      });
    }

    if (ctx.papel === PAPEIS.PROFESSOR) {
      // Professor: somente turmas que ele criou.
      return this.turmaRepository.listarComFiltros({
        ...filtros,
        professorId: ctx.id
      });
    }

    // ADMINISTRADOR: lista todas as turmas, sem filtro por professor.
    return this.turmaRepository.listarComFiltros(filtros);
  }

  async criar(data: CriarTurmaDto, professorId: string) {
    await this.validarCodigoDisponivel(data.codigo);

    return this.turmaRepository.criar({
      ...data,
      professorId
    });
  }

  async atualizar(id: string, ctx: UsuarioContexto, data: AtualizarTurmaDto) {
    const turma = await this.obterPorId(id, ctx);

    if (data.codigo && data.codigo !== turma.codigo) {
      await this.validarCodigoDisponivel(data.codigo);
    }

    return this.turmaRepository.atualizar(turma.id, data);
  }

  async obterPorId(id: string, ctx: UsuarioContexto) {
    const turma = await this.turmaRepository.buscarPorId(id);

    if (!turma) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: 'Turma não encontrada.',
        codigoStatus: 404
      });
    }

    if (ctx.papel === PAPEIS.ALUNO) {
      const vinculo = await this.turmaRepository.buscarVinculoAtivoAluno(turma.id, ctx.id);

      // Mantem 404 (em vez de 403) para nao vazar existencia de turmas
      // as quais o aluno nao pertence ou que ja foram inativadas.
      if (!vinculo || turma.status !== 'ATIVA') {
        throw new ErroAplicacao({
          codigo: CodigoDeErro.NAO_ENCONTRADO,
          mensagem: 'Turma não encontrada.',
          codigoStatus: 404
        });
      }

      return turma;
    }

    if (ctx.papel === PAPEIS.PROFESSOR && turma.professorId !== ctx.id) {
      throw new ErroAplicacao({
        codigo: CodigoDeErro.PROIBIDO,
        mensagem: 'Você não tem permissão para acessar esta turma.',
        codigoStatus: 403
      });
    }

    return turma;
  }

  async deletar(id: string, ctx: UsuarioContexto) {
    const turma = await this.obterPorId(id, ctx);
    await this.turmaRepository.deletarLogico(turma.id);
  }

  async listarAlunos(id: string, ctx: UsuarioContexto) {
    const turma = await this.obterPorId(id, ctx);
    return this.turmaRepository.listarAlunos(turma.id);
  }

  async vincularAluno(id: string, ctx: UsuarioContexto, alunoId: string) {
    const turma = await this.obterPorId(id, ctx);
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

  async desvincularAluno(id: string, ctx: UsuarioContexto, alunoId: string) {
    const turma = await this.obterPorId(id, ctx);
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
