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

/**
 * Service de turmas.
 *
 * Aplica as regras de acesso por papel (aluno ve so as suas turmas ativas; professor
 * so as que criou; admin ve todas) sobre CRUD de turmas e vinculo de alunos.
 */
export class TurmaService {
  constructor(private readonly turmaRepository: TurmaRepository) {}

  /**
   * Lista turmas conforme o papel do usuario.
   *
   * @param ctx Usuario autenticado (id e papel).
   * @param filtros Filtros de busca/semestre/ano (status restrito a gestao).
   * @returns Turmas visiveis para aquele usuario.
   * @throws ErroAplicacao 400 se aluno tentar filtrar por status.
   */
  async listar(ctx: UsuarioContexto, filtros: FiltrosListagemTurma) {
    if (ctx.papel === PAPEIS.ALUNO) {
      // Aluno so pode listar turmas ATIVAS vinculadas. Rejeita filtros
      // que nao se aplicam ao escopo dele em vez de ignorar silenciosamente.
      if (filtros.status !== undefined) {
        throw new ErroAplicacao({
          codigo: CodigoDeErro.REQUISICAO_INVALIDA,
          mensagem: 'Filtro de status nao e permitido para alunos.',
          codigoStatus: 400
        });
      }

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

  // Cria uma turma do professor, exigindo codigo unico.
  async criar(data: CriarTurmaDto, professorId: string) {
    await this.validarCodigoDisponivel(data.codigo);

    return this.turmaRepository.criar({
      ...data,
      professorId
    });
  }

  // Atualiza a turma (revalida o codigo so se ele mudou).
  async atualizar(id: string, ctx: UsuarioContexto, data: AtualizarTurmaDto) {
    const turma = await this.obterPorId(id, ctx);

    if (data.codigo && data.codigo !== turma.codigo) {
      await this.validarCodigoDisponivel(data.codigo);
    }

    return this.turmaRepository.atualizar(turma.id, data);
  }

  /**
   * Carrega a turma aplicando o controle de acesso por papel.
   *
   * Aluno so acessa turma ATIVA na qual tem vinculo (senao 404, para nao vazar
   * existencia); professor so acessa as proprias (senao 403); admin acessa qualquer uma.
   *
   * @param id Id da turma.
   * @param ctx Usuario autenticado.
   * @returns A turma, se permitido.
   * @throws ErroAplicacao 404/403 conforme o caso.
   */
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

  // Remove a turma via soft delete (apos checar acesso).
  async deletar(id: string, ctx: UsuarioContexto) {
    const turma = await this.obterPorId(id, ctx);
    await this.turmaRepository.deletarLogico(turma.id);
  }

  // Lista os alunos vinculados a turma (apos checar acesso).
  async listarAlunos(id: string, ctx: UsuarioContexto) {
    const turma = await this.obterPorId(id, ctx);
    return this.turmaRepository.listarAlunos(turma.id);
  }

  // Vincula um aluno; cria o vinculo, reativa se existia excluido, ou 409 se ja ativo.
  async vincularAluno(id: string, ctx: UsuarioContexto, alunoId: string) {
    const turma = await this.obterPorId(id, ctx);
    const vinculo = await this.turmaRepository.buscarVinculoAluno(turma.id, alunoId);

    // Sem vinculo previo: cria um novo.
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

    // Vinculo existia mas estava excluido: reativa em vez de criar outro.
    return this.turmaRepository.reativarVinculoAluno(vinculo.id);
  }

  // Desvincula um aluno (soft delete do vinculo); 404 se nao houver vinculo ativo.
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

  // Garante que o codigo da turma e unico (senao 409).
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
