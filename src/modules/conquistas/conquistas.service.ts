import { Conquista, TierConquista } from "@prisma/client";
import { CONFIG_TIERS } from "./conquistas.constants";
import { ConquistaRepository } from "./conquistas.repository";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { MENSAGENS } from "@/shared/constants/mensagens";
import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";
import { RespostaPaginada } from "@/shared/types/api.types";
import {
  ConquistaDesbloqueadaDto,
  PaginacaoQueryDto,
  ProgressoConquistaDto,
  ResumoConquistaDesbloqueadaDto,
  ResumoConquistaDto,
} from "./conquistas.dto";

export class ConquistaService {
  constructor(private readonly conquistaRepository: ConquistaRepository) {}

  async criarConquistaPadraoTema(temaId: string, nomeTema: string) {
    const existe = await this.conquistaRepository.existeConquistaTema(temaId);

    if (existe) {
      return;
    }

    return await this.conquistaRepository.criarConquistaTema(temaId, nomeTema);
  }

  async processarRespostaQuestao(
    usuarioId: string,
    temaId: string,
    temaNome: string,
    correta: boolean,
  ): Promise<ConquistaDesbloqueadaDto[]> {
    const desbloqueadas: ConquistaDesbloqueadaDto[] = [];

    if (correta) {
      desbloqueadas.push(
        ...(await this.processarTotalAcertos(usuarioId)),
        ...(await this.processarTotalAcertosTema(usuarioId, temaId, temaNome)),
      );
    }

    desbloqueadas.push(...(await this.processarStreak(usuarioId, correta)));

    return desbloqueadas;
  }

  private async processarTotalAcertos(usuarioId: string) {
    const conquista = await this.conquistaRepository.buscarConquistaTotalAcertos();

    if (!conquista) {
      return [];
    }

    const progresso = await this.conquistaRepository.buscarOuCriarProgresso(
      usuarioId,
      conquista.id,
    );

    return this.atualizarConquista(usuarioId, conquista, progresso.valorProgresso + 1);
  }

  private async processarTotalAcertosTema(usuarioId: string, temaId: string, temaNome: string) {
    await this.criarConquistaPadraoTema(temaId, temaNome);

    const conquista = await this.conquistaRepository.buscarConquistaTema(temaId);

    if (!conquista) {
      return [];
    }

    const progresso = await this.conquistaRepository.buscarOuCriarProgresso(
      usuarioId,
      conquista.id,
    );

    return this.atualizarConquista(usuarioId, conquista, progresso.valorProgresso + 1);
  }

  private async processarStreak(usuarioId: string, correta: boolean) {
    const conquista = await this.conquistaRepository.buscarConquistaStreak();

    if (!conquista) {
      return [];
    }

    const progresso = await this.conquistaRepository.buscarOuCriarProgresso(
      usuarioId,
      conquista.id,
    );

    return this.atualizarConquista(
      usuarioId,
      conquista,
      correta ? progresso.valorProgresso + 1 : 0,
    );
  }

  private async atualizarConquista(
    usuarioId: string,
    conquista: Conquista,
    novoValor: number,
  ): Promise<ConquistaDesbloqueadaDto[]> {
    const atualizado = await this.conquistaRepository.atualizarProgresso(
      usuarioId,
      conquista.id,
      novoValor,
    );

    const tiers = CONFIG_TIERS[conquista.tipoConquista];
    if (!tiers) {
      return [];
    }

    const tiersEntries = Object.entries(tiers) as [TierConquista, number][];

    const desbloqueadas = [];
    for (const [tier, objetivo] of tiersEntries) {
      if (atualizado.valorProgresso < objetivo) {
        continue;
      }

      const possui = await this.conquistaRepository.possuiTier(usuarioId, conquista.id, tier);

      if (possui) {
        continue;
      }

      await this.conquistaRepository.criarDesbloqueio(usuarioId, conquista.id, tier);

      desbloqueadas.push({
        conquistaId: conquista.id,
        nome: conquista.nome,
        descricao: conquista.descricao,
        tier,
      });
    }
    return desbloqueadas;
  }

  async alterarDestaque(usuarioId: string | undefined, desbloqueioId: string, destaque: boolean) {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const desbloqueio = await this.conquistaRepository.buscarDesbloqueioPorId(
      usuarioId,
      desbloqueioId,
    );

    if (!desbloqueio) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.RECURSO_NAO_ENCONTRADO,
        mensagem: "Conquista não encontrada.",
      });
    }

    if (destaque) {
      const quantidade = await this.conquistaRepository.contarConquistasDestacadas(usuarioId);

      if (quantidade >= 3) {
        throw new ErroAplicacao({
          codigoStatus: 400,
          codigo: CodigoDeErro.REQUISICAO_INVALIDA,
          mensagem: "Apenas três conquistas podem ser destacadas.",
        });
      }
    }

    await this.conquistaRepository.alterarDestaque(usuarioId, desbloqueioId, destaque);

    return {
      sucesso: true,
    };
  }

  async buscarConquistasDestacadas(usuarioId: string | undefined) {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const conquistas = await this.conquistaRepository.buscarConquistasDestacadas(usuarioId);

    return conquistas.map((item) => ({
      id: item.id,
      nome: item.conquista.nome,
      descricao: item.conquista.descricao,
      tier: item.tier,
      conquistadoEm: item.conquistadoEm,
    }));
  }

  async listarProgressoUsuario(
    query: PaginacaoQueryDto,
    usuarioId: string | undefined,
  ): Promise<RespostaPaginada<ProgressoConquistaDto>> {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const paginacao = resolverParametrosPaginacao(query);

    const { data, total } = await this.conquistaRepository.listarProgressoUsuario(
      usuarioId,
      paginacao,
    );

    return {
      dados: data.map((item) => ({
        id: item.id,
        valor_progresso: item.valorProgresso,
        nome: item.conquista.nome,
        descricao: item.conquista.descricao,
        tipoConquista: item.conquista.tipoConquista,
        desbloqueios: item.conquista.desbloqueios,
      })),

      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  async listarMeuProgressoEmConquista(
    usuarioId: string | undefined,
    minhaConquistaId: string,
  ): Promise<ProgressoConquistaDto> {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const progresso = await this.conquistaRepository.listarMeuProgressoEmConquista(
      usuarioId,
      minhaConquistaId,
    );

    if (!progresso) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    return {
      id: progresso.id,
      valor_progresso: progresso.valorProgresso,
      nome: progresso.conquista.nome,
      descricao: progresso.conquista.descricao,
      tipoConquista: progresso.conquista.tipoConquista,
      desbloqueios: progresso.conquista.desbloqueios,
    };
  }

  async listarDesbloqueadasUsuario(
    query: PaginacaoQueryDto,
    usuarioId: string | undefined,
  ): Promise<RespostaPaginada<ResumoConquistaDesbloqueadaDto>> {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const paginacao = resolverParametrosPaginacao(query);

    const { data, total } = await this.conquistaRepository.listarDesbloqueadasUsuario(
      usuarioId,
      paginacao,
    );

    return {
      dados: data.map((item) => ({
        id: item.id,
        nome: item.conquista.nome,
        descricao: item.conquista.descricao,
        tier: item.tier,
        destaque: item.destaque,
        conquistadoEm: item.conquistadoEm,
      })),

      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  async listarConquistas(query: PaginacaoQueryDto): Promise<RespostaPaginada<ResumoConquistaDto>> {
    const paginacao = resolverParametrosPaginacao(query);

    const { data, total } = await this.conquistaRepository.listarConquistas(paginacao);

    return {
      dados: data.map((conquista) => ({
        id: conquista.id,
        nome: conquista.nome,
        descricao: conquista.descricao,
        tipoConquista: conquista.tipoConquista,
        temaId: conquista.temaId,
      })),

      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }
}
