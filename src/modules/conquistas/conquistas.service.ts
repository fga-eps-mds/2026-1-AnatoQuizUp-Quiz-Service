import type { Conquista, TierConquista } from "@prisma/client";
import { ATP_POR_TIER_DESBLOQUEIO, CONFIG_TIERS } from "./conquistas.constants";
import type { ConquistaRepository } from "./conquistas.repository";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { MENSAGENS } from "@/shared/constants/mensagens";
import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type {
  ConquistaDestaqueSocialDto,
  ConquistaDesbloqueadaDto,
  PaginacaoQueryDto,
  ProgressoConquistaConsolidadoDto,
  ProgressoConquistaDto,
  ResumoConquistaDesbloqueadaDto,
  ResumoConquistaDto,
} from "./conquistas.dto";

const ORDEM_TIERS: TierConquista[] = ["BRONZE", "PRATA", "OURO"];
type ConquistaConsolidadaBanco = NonNullable<
  Awaited<ReturnType<ConquistaRepository["buscarProgressoConquistaUsuario"]>>
>;

export class ConquistaService {
  constructor(private readonly conquistaRepository: ConquistaRepository) {}

  async criarConquistaPadraoTema(temaId: string, nomeTema: string) {
    const existe = await this.conquistaRepository.existeConquistaTema(temaId);

    if (existe) {
      return;
    }

    const conquista_criada = await this.conquistaRepository.criarConquistaTema(temaId, nomeTema);

    if (!conquista_criada) {
      throw new ErroAplicacao({
        codigoStatus: 400,
        codigo: CodigoDeErro.RECURSO_NAO_ENCONTRADO,
        mensagem: "Não foi possível criar conquista",
      });
    }

    return conquista_criada;
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

  protected async processarTotalAcertos(usuarioId: string) {
    const conquista = await this.conquistaRepository.buscarConquistaTotalAcertos();

    if (!conquista) {
      return [];
    }

    const progresso = await this.conquistaRepository.buscarOuCriarProgresso(
      usuarioId,
      conquista.id,
    );

    if (!progresso) {
      throw new ErroAplicacao({
        codigoStatus: 400,
        codigo: CodigoDeErro.RECURSO_NAO_ENCONTRADO,
        mensagem: "Não foi possível registrar progresso em conquista",
      });
    }

    return this.atualizarConquista(usuarioId, conquista, progresso.valorProgresso + 1);
  }

  protected async processarTotalAcertosTema(usuarioId: string, temaId: string, temaNome: string) {
    await this.criarConquistaPadraoTema(temaId, temaNome);

    const conquista = await this.conquistaRepository.buscarConquistaTema(temaId);

    if (!conquista) {
      return [];
    }

    const progresso = await this.conquistaRepository.buscarOuCriarProgresso(
      usuarioId,
      conquista.id,
    );

    if (!progresso) {
      throw new ErroAplicacao({
        codigoStatus: 400,
        codigo: CodigoDeErro.RECURSO_NAO_ENCONTRADO,
        mensagem: "Não foi possível registrar progresso em conquista",
      });
    }

    return this.atualizarConquista(usuarioId, conquista, progresso.valorProgresso + 1);
  }

  protected async processarStreak(usuarioId: string, correta: boolean) {
    const conquista = await this.conquistaRepository.buscarConquistaStreak();

    if (!conquista) {
      return [];
    }

    const progresso = await this.conquistaRepository.buscarOuCriarProgresso(
      usuarioId,
      conquista.id,
    );

    if (!progresso) {
      throw new ErroAplicacao({
        codigoStatus: 400,
        codigo: CodigoDeErro.RECURSO_NAO_ENCONTRADO,
        mensagem: "Não foi possível registrar progresso em conquista",
      });
    }

    return this.atualizarConquista(
      usuarioId,
      conquista,
      correta ? progresso.valorProgresso + 1 : 0,
    );
  }

  protected async atualizarConquista(
    usuarioId: string,
    conquista: Conquista,
    novoValor: number,
  ): Promise<ConquistaDesbloqueadaDto[]> {
    const atualizado = await this.conquistaRepository.atualizarProgresso(
      usuarioId,
      conquista.id,
      novoValor,
    );

    if (!atualizado) {
      throw new ErroAplicacao({
        codigoStatus: 400,
        codigo: CodigoDeErro.RECURSO_NAO_ENCONTRADO,
        mensagem: "Não foi possível atualizar progresso em conquista",
      });
    }

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

      const recompensa = await this.conquistaRepository.criarDesbloqueioComRecompensas(
        usuarioId,
        conquista.id,
        tier,
        ATP_POR_TIER_DESBLOQUEIO[tier],
      );

      if (!recompensa) {
        continue;
      }

      desbloqueadas.push({
        conquistaId: conquista.id,
        desbloqueioId: recompensa.desbloqueio.id,
        nome: conquista.nome,
        descricao: conquista.descricao,
        tier,
        tipoConquista: conquista.tipoConquista,
        temaId: conquista.temaId,
        moedasConcedidas: recompensa.moedasConcedidas,
        saldoMoedas: recompensa.saldoMoedas,
        itemConcedido: recompensa.itemConcedido
          ? {
              id: recompensa.itemConcedido.id,
              codigo: recompensa.itemConcedido.codigo,
              nome: recompensa.itemConcedido.nome,
              descricao: recompensa.itemConcedido.descricao,
              tipo: recompensa.itemConcedido.tipo,
              valor: recompensa.itemConcedido.valor,
              imagemUrl: recompensa.itemConcedido.imagemUrl,
              previewImagemUrl: recompensa.itemConcedido.previewImagemUrl,
            }
          : null,
      });
    }

    return desbloqueadas;
  }

  async alterarDestaque(usuarioId: string | undefined, desbloqueioId: string, destaque: boolean) {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioNaoEncontrado,
      });
    }

    const desbloqueio = await this.conquistaRepository.buscarDesbloqueioPorId(
      usuarioId,
      desbloqueioId,
    );

    if (!desbloqueio) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: MENSAGENS.conquistaNaoEncontrada,
      });
    }

    if (desbloqueio.destaque === destaque) {
      return {
        sucesso: true,
      };
    }

    if (destaque) {
      const quantidade = await this.conquistaRepository.contarConquistasDestacadas(usuarioId);

      if (quantidade >= 3) {
        throw new ErroAplicacao({
          codigoStatus: 409,
          codigo: CodigoDeErro.CONFLITO,
          mensagem: MENSAGENS.limiteConquistasDestacadas,
        });
      }
    }

    const resultado = await this.conquistaRepository.alterarDestaque(
      usuarioId,
      desbloqueioId,
      destaque,
    );

    if (resultado.count === 0) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: MENSAGENS.conquistaNaoEncontrada,
      });
    }

    return {
      sucesso: true,
    };
  }

  async buscarConquistasDestacadas(
    usuarioId: string | undefined,
  ): Promise<ConquistaDestaqueSocialDto[]> {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioNaoEncontrado,
      });
    }

    const conquistas = await this.conquistaRepository.buscarConquistasDestacadas(usuarioId);

    return conquistas.map((item) => ({
      desbloqueioId: item.id,
      conquistaId: item.conquista.id,
      nome: item.conquista.nome,
      descricao: item.conquista.descricao,
      tier: item.tier,
      tipoConquista: item.conquista.tipoConquista,
      tema: item.conquista.tema,
      conquistadoEm: item.conquistadoEm,
    }));
  }

  async listarProgressoUsuario(
    query: PaginacaoQueryDto,
    usuarioId: string | undefined,
  ): Promise<RespostaPaginada<ProgressoConquistaConsolidadoDto>> {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioNaoEncontrado,
      });
    }

    const paginacao = resolverParametrosPaginacao(query);

    const { data, total } = await this.conquistaRepository.listarProgressoUsuario(
      usuarioId,
      paginacao,
    );

    return {
      dados: data.map((conquista) => this.converterProgressoConsolidado(conquista)),

      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  async buscarDetalheConquista(
    usuarioId: string | undefined,
    conquistaId: string,
  ): Promise<ProgressoConquistaConsolidadoDto> {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioNaoEncontrado,
      });
    }

    const conquista = await this.conquistaRepository.buscarProgressoConquistaUsuario(
      usuarioId,
      conquistaId,
    );

    if (!conquista) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: MENSAGENS.conquistaNaoEncontrada,
      });
    }

    return this.converterProgressoConsolidado(conquista);
  }

  async listarDestaquesUsuarios(
    usuarioIds: string[],
  ): Promise<Record<string, ConquistaDestaqueSocialDto[]>> {
    const destaques = await this.conquistaRepository.listarDestaquesUsuarios(usuarioIds);
    const dados = Object.fromEntries(
      usuarioIds.map((usuarioId) => [usuarioId, [] as ConquistaDestaqueSocialDto[]]),
    );

    for (const destaque of destaques) {
      dados[destaque.usuarioId].push({
        desbloqueioId: destaque.id,
        conquistaId: destaque.conquista.id,
        nome: destaque.conquista.nome,
        descricao: destaque.conquista.descricao,
        tier: destaque.tier,
        tipoConquista: destaque.conquista.tipoConquista,
        tema: destaque.conquista.tema,
        conquistadoEm: destaque.conquistadoEm,
      });
    }

    return dados;
  }

  async listarMeuProgressoEmConquista(
    usuarioId: string | undefined,
    minhaConquistaId: string,
  ): Promise<ProgressoConquistaDto> {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioNaoEncontrado,
      });
    }

    const progresso = await this.conquistaRepository.listarMeuProgressoEmConquista(
      usuarioId,
      minhaConquistaId,
    );

    if (!progresso) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: MENSAGENS.conquistaNaoEncontrada,
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
        mensagem: MENSAGENS.usuarioNaoEncontrado,
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

  private converterProgressoConsolidado(
    conquista: ConquistaConsolidadaBanco,
  ): ProgressoConquistaConsolidadoDto {
    const valorProgresso = conquista.usuarios[0]?.valorProgresso ?? 0;
    const objetivos = CONFIG_TIERS[conquista.tipoConquista];

    const tiers = objetivos
      ? ORDEM_TIERS.map((tier) => {
          const desbloqueio = conquista.desbloqueios.find((registro) => registro.tier === tier);
          const recompensa = conquista.recompensasItens.find((registro) => registro.tier === tier);

          return {
            tier,
            objetivo: objetivos[tier],
            desbloqueado: Boolean(desbloqueio),
            desbloqueioId: desbloqueio?.id ?? null,
            destaque: desbloqueio?.destaque ?? false,
            conquistadoEm: desbloqueio?.conquistadoEm ?? null,
            moedas: ATP_POR_TIER_DESBLOQUEIO[tier],
            item: recompensa?.itemLoja ?? null,
          };
        })
      : [];

    const proximo = tiers.find((tier) => !tier.desbloqueado);
    const percentual = proximo
      ? Math.min(100, Math.round((valorProgresso / proximo.objetivo) * 100))
      : tiers.length > 0
        ? 100
        : 0;

    return {
      id: conquista.id,
      nome: conquista.nome,
      descricao: conquista.descricao,
      tipoConquista: conquista.tipoConquista,
      tema: conquista.tema,
      valorProgresso,
      proximoTier: proximo?.tier ?? null,
      proximoObjetivo: proximo?.objetivo ?? null,
      percentual,
      tiers,
    };
  }
}
