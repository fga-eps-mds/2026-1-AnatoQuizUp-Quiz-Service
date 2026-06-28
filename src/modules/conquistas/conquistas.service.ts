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

// Ordem crescente dos tiers de conquista (do mais facil ao mais dificil).
const ORDEM_TIERS: TierConquista[] = ["BRONZE", "PRATA", "OURO"];
// Tipo da conquista ja consolidada (progresso + desbloqueios + recompensas) do banco.
type ConquistaConsolidadaBanco = NonNullable<
  Awaited<ReturnType<ConquistaRepository["buscarProgressoConquistaUsuario"]>>
>;

/**
 * Service de conquistas (gamificacao).
 *
 * Cuida do ciclo de vida das conquistas: acompanha o progresso do aluno conforme ele
 * acerta questoes, desbloqueia tiers (BRONZE/PRATA/OURO) concedendo recompensas
 * (moedas/itens), e expoe listagens/detalhes e o sistema de destaques no perfil.
 */
export class ConquistaService {
  constructor(private readonly conquistaRepository: ConquistaRepository) {}

  /**
   * Garante que existe a conquista padrao de um tema (cria sob demanda, uma vez).
   *
   * @param temaId Id do tema.
   * @param nomeTema Nome do tema, usado no texto da conquista.
   * @returns A conquista criada, ou undefined se ja existia.
   * @throws ErroAplicacao 400 se a criacao falhar.
   */
  async criarConquistaPadraoTema(temaId: string, nomeTema: string) {
    const existe = await this.conquistaRepository.existeConquistaTema(temaId);

    // Idempotente: se a conquista do tema ja existe, nao faz nada.
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

  /**
   * Processa o impacto de uma resposta nas conquistas do aluno.
   *
   * Ponto de entrada chamado a cada questao respondida: se acertou, avanca as
   * conquistas de total de acertos (geral e por tema); o streak e sempre avaliado
   * (acerto incrementa, erro zera). Retorna todas as conquistas desbloqueadas agora.
   *
   * @param usuarioId Aluno que respondeu.
   * @param temaId Tema da questao.
   * @param temaNome Nome do tema (para criar a conquista do tema, se preciso).
   * @param correta Se a resposta foi correta.
   * @returns Lista de conquistas desbloqueadas nesta resposta.
   */
  async processarRespostaQuestao(
    usuarioId: string,
    temaId: string,
    temaNome: string,
    correta: boolean,
  ): Promise<ConquistaDesbloqueadaDto[]> {
    const desbloqueadas: ConquistaDesbloqueadaDto[] = [];

    // Acertos so contam para as conquistas de acerto (geral e por tema).
    if (correta) {
      desbloqueadas.push(
        ...(await this.processarTotalAcertos(usuarioId)),
        ...(await this.processarTotalAcertosTema(usuarioId, temaId, temaNome)),
      );
    }

    // O streak e avaliado sempre: acerto soma, erro reseta para zero.
    desbloqueadas.push(...(await this.processarStreak(usuarioId, correta)));

    return desbloqueadas;
  }

  // Avanca a conquista de total de acertos geral (+1) e checa desbloqueios.
  protected async processarTotalAcertos(usuarioId: string) {
    const conquista = await this.conquistaRepository.buscarConquistaTotalAcertos();

    // Sem a conquista cadastrada nao ha o que progredir.
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

  // Avanca a conquista de acertos especifica do tema (criando-a se ainda nao existir).
  protected async processarTotalAcertosTema(usuarioId: string, temaId: string, temaNome: string) {
    // Garante a conquista do tema antes de tentar progredir nela.
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

  // Atualiza a conquista de sequencia (streak): acerto soma 1, erro zera o progresso.
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

  /**
   * Grava o novo valor de progresso e desbloqueia os tiers ja alcancados.
   *
   * Para cada tier cujo objetivo foi atingido, tenta criar o desbloqueio com suas
   * recompensas (moedas e, possivelmente, item). Desbloqueios ja existentes sao
   * ignorados pelo repository (retorno nulo), evitando conceder recompensa em dobro.
   *
   * @param usuarioId Aluno dono do progresso.
   * @param conquista Conquista sendo atualizada.
   * @param novoValor Novo valor de progresso a gravar.
   * @returns Lista dos tiers desbloqueados nesta atualizacao.
   * @throws ErroAplicacao 400 se a gravacao do progresso falhar.
   */
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

    // Sem configuracao de tiers para este tipo, nao ha desbloqueios a processar.
    const tiers = CONFIG_TIERS[conquista.tipoConquista];
    if (!tiers) {
      return [];
    }

    const tiersEntries = Object.entries(tiers) as [TierConquista, number][];

    const desbloqueadas = [];
    for (const [tier, objetivo] of tiersEntries) {
      // Pula tiers cujo objetivo ainda nao foi alcancado pelo progresso atual.
      if (atualizado.valorProgresso < objetivo) {
        continue;
      }

      // Cria o desbloqueio + recompensas de forma atomica no repository.
      const recompensa = await this.conquistaRepository.criarDesbloqueioComRecompensas(
        usuarioId,
        conquista.id,
        tier,
        ATP_POR_TIER_DESBLOQUEIO[tier],
      );

      // Retorno nulo = tier ja estava desbloqueado; nao concede recompensa de novo.
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

  /**
   * Marca ou desmarca uma conquista desbloqueada como destaque do perfil.
   *
   * Limite de 3 destaques por usuario. Operacao idempotente: se ja estiver no estado
   * pedido, retorna sucesso sem alterar nada.
   *
   * @param usuarioId Dono da conquista.
   * @param desbloqueioId Id do desbloqueio a (des)destacar.
   * @param destaque Novo estado de destaque.
   * @returns { sucesso: true } quando aplicado.
   * @throws ErroAplicacao 401/404/409 conforme a regra violada.
   */
  async alterarDestaque(usuarioId: string | undefined, desbloqueioId: string, destaque: boolean) {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioNaoEncontrado,
      });
    }

    // O desbloqueio precisa existir e pertencer ao proprio usuario.
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

    // Ja esta no estado desejado: nada a fazer.
    if (desbloqueio.destaque === destaque) {
      return {
        sucesso: true,
      };
    }

    // Ao destacar, respeita o limite maximo de 3 conquistas em destaque.
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

  /**
   * Lista as conquistas que o usuario marcou como destaque (para o perfil social).
   *
   * @param usuarioId Dono do perfil.
   * @returns Conquistas destacadas no formato social.
   * @throws ErroAplicacao 401 se nao houver usuario.
   */
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

    // Achata a estrutura do banco para o DTO consumido pelo perfil social.
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

  /**
   * Lista, paginado, o progresso consolidado do usuario em todas as conquistas.
   *
   * @param query Parametros de paginacao.
   * @param usuarioId Aluno consultado.
   * @returns Pagina de progresso consolidado com metadados.
   * @throws ErroAplicacao 401 se nao houver usuario.
   */
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

  /**
   * Retorna o detalhe consolidado de uma conquista especifica para o usuario.
   *
   * @param usuarioId Aluno consultado.
   * @param conquistaId Conquista alvo.
   * @returns Progresso consolidado da conquista.
   * @throws ErroAplicacao 401/404 conforme o caso.
   */
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

  /**
   * Lista as conquistas em destaque de varios usuarios de uma vez (uso social/ranking).
   *
   * Pre-inicializa o mapa com array vazio para cada id pedido, garantindo que mesmo
   * usuarios sem destaques aparecam no resultado.
   *
   * @param usuarioIds Ids dos usuarios consultados.
   * @returns Mapa de usuarioId para suas conquistas destacadas.
   */
  async listarDestaquesUsuarios(
    usuarioIds: string[],
  ): Promise<Record<string, ConquistaDestaqueSocialDto[]>> {
    const destaques = await this.conquistaRepository.listarDestaquesUsuarios(usuarioIds);
    // Garante uma entrada (vazia) para cada usuario pedido, mesmo sem destaques.
    const dados = Object.fromEntries(
      usuarioIds.map((usuarioId) => [usuarioId, [] as ConquistaDestaqueSocialDto[]]),
    );

    // Distribui cada destaque encontrado no balde do seu respectivo usuario.
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

  /**
   * Retorna o progresso bruto do usuario em uma conquista (sem consolidar tiers).
   *
   * @param usuarioId Aluno consultado.
   * @param minhaConquistaId Conquista alvo.
   * @returns Progresso simples (valor + dados da conquista e desbloqueios).
   * @throws ErroAplicacao 401/404 conforme o caso.
   */
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

  /**
   * Lista, paginado, as conquistas que o usuario ja desbloqueou.
   *
   * @param query Parametros de paginacao.
   * @param usuarioId Aluno consultado.
   * @returns Pagina de conquistas desbloqueadas com metadados.
   * @throws ErroAplicacao 401 se nao houver usuario.
   */
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

  /**
   * Lista todas as conquistas existentes (catalogo), de forma paginada.
   *
   * @param query Parametros de paginacao.
   * @returns Pagina do catalogo de conquistas com metadados.
   */
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

  /**
   * Consolida o estado de uma conquista para exibicao (progresso + tiers + %).
   *
   * Monta a lista de tiers (objetivo, se desbloqueado, recompensa), identifica o
   * proximo tier nao alcancado e calcula o percentual rumo a ele (100% se tudo feito).
   *
   * @param conquista Conquista com progresso/desbloqueios/recompensas carregados.
   * @returns DTO consolidado pronto para o front.
   */
  private converterProgressoConsolidado(
    conquista: ConquistaConsolidadaBanco,
  ): ProgressoConquistaConsolidadoDto {
    // valorProgresso do usuario (0 quando ele ainda nao tem registro de progresso).
    const valorProgresso = conquista.usuarios[0]?.valorProgresso ?? 0;
    const objetivos = CONFIG_TIERS[conquista.tipoConquista];

    // Monta cada tier com seu objetivo, estado de desbloqueio e recompensa associada.
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

    // Proximo tier ainda nao desbloqueado (alvo atual do aluno).
    const proximo = tiers.find((tier) => !tier.desbloqueado);
    // % rumo ao proximo tier; 100 se tudo desbloqueado; 0 se a conquista nao tem tiers.
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
