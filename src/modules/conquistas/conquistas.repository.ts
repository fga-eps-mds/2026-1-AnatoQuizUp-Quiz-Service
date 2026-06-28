import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";
import {
  FonteMoeda,
  OrigemItemInventario,
  type TierConquista,
  TipoConquista,
} from "@prisma/client";

// Repository de conquistas: acesso a dados (Prisma) do dominio de gamificacao -
// conquistas, progresso por usuario, desbloqueios e suas recompensas (moedas/itens).
export class ConquistaRepository {
  /**
   * Cria a conquista padrao "Especialista em <tema>" para um tema.
   *
   * @param temaId Id do tema associado.
   * @param nomeTema Nome do tema (compoe nome/descricao da conquista).
   * @returns A conquista criada.
   */
  async criarConquistaTema(temaId: string, nomeTema: string) {
    return prisma.conquista.create({
      data: {
        nome: `Especialista em ${nomeTema}`,
        descricao: `Conquista obtida ao demonstrar domínio no tema ${nomeTema}.`,
        tipoConquista: "TOTAL_ACERTOS_TEMA",
        temaId,
      },
    });
  }

  /**
   * Verifica se ja existe a conquista de acertos para o tema.
   *
   * @param temaId Id do tema.
   * @returns A conquista do tema (com o tema) ou null.
   */
  async existeConquistaTema(temaId: string) {
    return prisma.conquista.findFirst({
      where: {
        temaId,
        tipoConquista: "TOTAL_ACERTOS_TEMA",
      },
      include: {
        tema: true,
      },
    });
  }

  /**
   * Conquista global de total de acertos (ativa).
   *
   * @returns A conquista de total de acertos ativa, ou null.
   */
  async buscarConquistaTotalAcertos() {
    return prisma.conquista.findFirst({
      where: {
        tipoConquista: TipoConquista.TOTAL_ACERTOS,
        ativo: true,
      },
    });
  }

  /**
   * Conquista de sequencia de acertos (streak) ativa.
   *
   * @returns A conquista de streak ativa, ou null.
   */
  async buscarConquistaStreak() {
    return prisma.conquista.findFirst({
      where: {
        tipoConquista: TipoConquista.STREAK_ACERTOS,
        ativo: true,
      },
    });
  }

  /**
   * Conquista de acertos ativa de um tema especifico.
   *
   * @param temaId Id do tema.
   * @returns A conquista de acertos do tema ativa, ou null.
   */
  async buscarConquistaTema(temaId: string) {
    return prisma.conquista.findFirst({
      where: {
        tipoConquista: TipoConquista.TOTAL_ACERTOS_TEMA,
        temaId,
        ativo: true,
      },
    });
  }

  /**
   * Garante (upsert) o registro de progresso do usuario na conquista, iniciando em 0.
   *
   * @param usuarioId Id do usuario.
   * @param conquistaId Id da conquista.
   * @returns O registro de progresso (existente ou recem-criado).
   */
  async buscarOuCriarProgresso(usuarioId: string, conquistaId: string) {
    return prisma.conquistaUsuario.upsert({
      where: {
        usuarioId_conquistaId: {
          usuarioId,
          conquistaId,
        },
      },

      create: {
        usuarioId,
        conquistaId,
        valorProgresso: 0,
      },

      update: {},
    });
  }

  /**
   * Grava o novo valor de progresso do usuario na conquista.
   *
   * @param usuarioId Id do usuario.
   * @param conquistaId Id da conquista.
   * @param valor Novo valor de progresso.
   * @returns O registro de progresso atualizado.
   */
  async atualizarProgresso(usuarioId: string, conquistaId: string, valor: number) {
    return prisma.conquistaUsuario.update({
      where: {
        usuarioId_conquistaId: {
          usuarioId,
          conquistaId,
        },
      },

      data: {
        valorProgresso: valor,
      },
    });
  }

  /**
   * Indica se o usuario ja possui o desbloqueio de um tier especifico.
   *
   * @param usuarioId Id do usuario.
   * @param conquistaId Id da conquista.
   * @param tier Tier consultado.
   * @returns O desbloqueio existente ou null.
   */
  async possuiTier(usuarioId: string, conquistaId: string, tier: TierConquista) {
    return prisma.desbloqueioConquista.findUnique({
      where: {
        usuarioId_conquistaId_tier: {
          usuarioId,
          conquistaId,
          tier,
        },
      },
    });
  }

  /**
   * Desbloqueia um tier e concede suas recompensas, tudo numa unica transacao.
   *
   * Idempotente por desenho: usa createMany com skipDuplicates para o desbloqueio, a
   * transacao de moedas e o item de inventario. Se o desbloqueio ja existia, retorna
   * null (nada e concedido novamente); o saldo so e incrementado quando a transacao
   * de moedas e de fato criada, evitando recompensa em dobro.
   *
   * @param usuarioId Aluno que desbloqueou.
   * @param conquistaId Conquista desbloqueada.
   * @param tier Tier alcancado.
   * @param quantidadeMoedas Moedas da recompensa do tier.
   * @returns Desbloqueio + moedas concedidas + saldo + item concedido, ou null se ja existia.
   */
  async criarDesbloqueioComRecompensas(
    usuarioId: string,
    conquistaId: string,
    tier: TierConquista,
    quantidadeMoedas: number,
  ) {
    return prisma.$transaction(async (tx) => {
      // Tenta criar o desbloqueio; duplicado e ignorado (skipDuplicates).
      const desbloqueioCriado = await tx.desbloqueioConquista.createMany({
        data: {
          usuarioId,
          conquistaId,
          tier,
        },
        skipDuplicates: true,
      });

      // Nada criado = tier ja desbloqueado antes; aborta sem conceder recompensa.
      if (desbloqueioCriado.count === 0) {
        return null;
      }

      const desbloqueio = await tx.desbloqueioConquista.findUniqueOrThrow({
        where: {
          usuarioId_conquistaId_tier: {
            usuarioId,
            conquistaId,
            tier,
          },
        },
      });

      // Garante que o usuario tenha uma carteira antes de creditar moedas.
      await tx.carteiraMoedas.upsert({
        where: { usuarioId },
        create: { usuarioId, saldo: 0 },
        update: {},
      });

      // Registra a transacao de moedas (idempotente por desbloqueio).
      const transacaoMoedas = await tx.transacaoMoeda.createMany({
        data: {
          usuarioId,
          desbloqueioId: desbloqueio.id,
          quantidade: quantidadeMoedas,
          fonte: FonteMoeda.DESBLOQUEIO_CONQUISTA,
          descricao: `Recompensa por conquista no tier ${tier}`,
        },
        skipDuplicates: true,
      });

      // So credita se a transacao foi realmente criada agora (evita credito duplo).
      const moedasConcedidas = transacaoMoedas.count === 1 ? quantidadeMoedas : 0;

      if (moedasConcedidas > 0) {
        await tx.carteiraMoedas.update({
          where: { usuarioId },
          data: {
            saldo: {
              increment: moedasConcedidas,
            },
          },
        });
      }

      // Verifica se este tier tem um item de loja como recompensa associada.
      const recompensaItem = await tx.recompensaItemConquista.findUnique({
        where: {
          conquistaId_tier: {
            conquistaId,
            tier,
          },
        },
        include: {
          itemLoja: true,
        },
      });

      let itemConcedido = null;

      // Havendo item, adiciona ao inventario (sem duplicar) e marca como concedido.
      if (recompensaItem) {
        const inventarioCriado = await tx.inventarioItem.createMany({
          data: {
            usuarioId,
            itemLojaId: recompensaItem.itemLojaId,
            desbloqueioConquistaId: desbloqueio.id,
            origem: OrigemItemInventario.CONQUISTA,
          },
          skipDuplicates: true,
        });

        if (inventarioCriado.count === 1) {
          itemConcedido = recompensaItem.itemLoja;
        }
      }

      const carteira = await tx.carteiraMoedas.findUniqueOrThrow({
        where: { usuarioId },
        select: { saldo: true },
      });

      return {
        desbloqueio,
        moedasConcedidas,
        saldoMoedas: carteira.saldo,
        itemConcedido,
      };
    });
  }

  /**
   * Marca/desmarca um desbloqueio como destaque (updateMany garante posse via where).
   *
   * @param usuarioId Id do usuario (garante que o desbloqueio e dele).
   * @param desbloqueioId Id do desbloqueio.
   * @param destaque Novo estado de destaque.
   * @returns Resultado do updateMany (count de registros afetados).
   */
  async alterarDestaque(usuarioId: string, desbloqueioId: string, destaque: boolean) {
    return prisma.desbloqueioConquista.updateMany({
      where: {
        id: desbloqueioId,
        usuarioId,
      },

      data: {
        destaque,
      },
    });
  }

  /**
   * Conta quantas conquistas o usuario tem em destaque (para o limite de 3).
   *
   * @param usuarioId Id do usuario.
   * @returns Quantidade de desbloqueios em destaque.
   */
  async contarConquistasDestacadas(usuarioId: string) {
    return prisma.desbloqueioConquista.count({
      where: {
        usuarioId,
        destaque: true,
      },
    });
  }

  /**
   * Busca um desbloqueio do usuario pelo id (valida posse).
   *
   * @param usuarioId Id do usuario.
   * @param desbloqueioId Id do desbloqueio.
   * @returns O desbloqueio do usuario ou null.
   */
  async buscarDesbloqueioPorId(usuarioId: string, desbloqueioId: string) {
    return prisma.desbloqueioConquista.findFirst({
      where: {
        id: desbloqueioId,
        usuarioId,
      },
    });
  }

  /**
   * Lista os desbloqueios destacados do usuario, com a conquista e o tema, recentes primeiro.
   *
   * @param usuarioId Id do usuario.
   * @returns Desbloqueios destacados (com conquista e tema).
   */
  async buscarConquistasDestacadas(usuarioId: string) {
    return prisma.desbloqueioConquista.findMany({
      where: {
        usuarioId,
        destaque: true,
      },

      include: {
        conquista: {
          include: {
            tema: true,
          },
        },
      },

      orderBy: {
        conquistadoEm: "desc",
      },
    });
  }

  /**
   * Lista paginada de conquistas ativas, cada uma ja com o progresso/desbloqueios do
   * usuario e as recompensas por tier embutidos (consolidacao feita no service).
   *
   * @param usuarioId Id do usuario.
   * @param paginacao Parametros de paginacao (skip/take).
   * @returns Pagina de conquistas com dados do usuario e o total.
   */
  async listarProgressoUsuario(usuarioId: string, paginacao: ParametrosPaginacao) {
    const [data, total] = await prisma.$transaction([
      prisma.conquista.findMany({
        where: {
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          descricao: true,
          tipoConquista: true,
          // Tema associado (presente apenas nas conquistas por tema).
          tema: {
            select: {
              id: true,
              nome: true,
            },
          },
          // Progresso do proprio usuario nesta conquista (1 registro).
          usuarios: {
            where: {
              usuarioId,
            },
            select: {
              valorProgresso: true,
            },
            take: 1,
          },
          // Tiers que o usuario ja desbloqueou nesta conquista.
          desbloqueios: {
            where: {
              usuarioId,
            },
            select: {
              id: true,
              tier: true,
              destaque: true,
              conquistadoEm: true,
            },
          },
          // Itens de loja oferecidos como recompensa por tier.
          recompensasItens: {
            select: {
              tier: true,
              itemLoja: {
                select: {
                  id: true,
                  codigo: true,
                  nome: true,
                  descricao: true,
                  tipo: true,
                  valor: true,
                  imagemUrl: true,
                  previewImagemUrl: true,
                },
              },
            },
          },
        },

        skip: paginacao.skip,
        take: paginacao.limit,

        // Ordena alfabeticamente para uma listagem estavel.
        orderBy: {
          nome: "asc",
        },
      }),

      prisma.conquista.count({
        where: {
          ativo: true,
        },
      }),
    ]);

    return {
      data,
      total,
    };
  }

  /**
   * Mesma consolidacao de listarProgressoUsuario, porem para uma unica conquista.
   *
   * @param usuarioId Id do usuario.
   * @param conquistaId Id da conquista.
   * @returns A conquista com progresso/desbloqueios/recompensas do usuario, ou null.
   */
  async buscarProgressoConquistaUsuario(usuarioId: string, conquistaId: string) {
    return prisma.conquista.findFirst({
      where: {
        id: conquistaId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        tipoConquista: true,
        // Tema associado (quando a conquista e por tema).
        tema: {
          select: {
            id: true,
            nome: true,
          },
        },
        // Progresso do usuario nesta conquista.
        usuarios: {
          where: {
            usuarioId,
          },
          select: {
            valorProgresso: true,
          },
          take: 1,
        },
        // Tiers ja desbloqueados pelo usuario.
        desbloqueios: {
          where: {
            usuarioId,
          },
          select: {
            id: true,
            tier: true,
            destaque: true,
            conquistadoEm: true,
          },
        },
        // Recompensas em item por tier.
        recompensasItens: {
          select: {
            tier: true,
            itemLoja: {
              select: {
                id: true,
                codigo: true,
                nome: true,
                descricao: true,
                tipo: true,
                valor: true,
                imagemUrl: true,
                previewImagemUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Busca em lote os desbloqueios destacados de varios usuarios (uso social/ranking).
   *
   * @param usuarioIds Ids dos usuarios consultados.
   * @returns Desbloqueios destacados de cada usuario, recentes primeiro.
   */
  async listarDestaquesUsuarios(usuarioIds: string[]) {
    return prisma.desbloqueioConquista.findMany({
      where: {
        usuarioId: {
          in: usuarioIds,
        },
        destaque: true,
        conquista: {
          ativo: true,
        },
      },
      select: {
        id: true,
        usuarioId: true,
        tier: true,
        conquistadoEm: true,
        conquista: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            tipoConquista: true,
            tema: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        conquistadoEm: "desc",
      },
    });
  }

  /**
   * Progresso bruto do usuario numa conquista (valor + desbloqueios ja obtidos).
   *
   * @param usuarioId Id do usuario.
   * @param minhaConquistaId Id da conquista.
   * @returns O progresso do usuario na conquista, ou null.
   */
  async listarMeuProgressoEmConquista(usuarioId: string, minhaConquistaId: string) {
    return await prisma.conquistaUsuario.findUnique({
      where: {
        usuarioId_conquistaId: {
          usuarioId,
          conquistaId: minhaConquistaId,
        },
      },
      select: {
        id: true,
        valorProgresso: true,
        conquista: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            tipoConquista: true,
            desbloqueios: {
              where: {
                usuarioId,
              },
              select: {
                tier: true,
                conquistadoEm: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Lista paginada dos desbloqueios do usuario (conquistas ja obtidas), recentes primeiro.
   *
   * @param usuarioId Id do usuario.
   * @param paginacao Parametros de paginacao (skip/take).
   * @returns Pagina de desbloqueios (com a conquista) e o total.
   */
  async listarDesbloqueadasUsuario(usuarioId: string, paginacao: ParametrosPaginacao) {
    const [data, total] = await prisma.$transaction([
      prisma.desbloqueioConquista.findMany({
        where: {
          usuarioId,
        },

        include: {
          conquista: true,
        },

        skip: paginacao.skip,
        take: paginacao.limit,

        orderBy: {
          conquistadoEm: "desc",
        },
      }),

      prisma.desbloqueioConquista.count({
        where: {
          usuarioId,
        },
      }),
    ]);

    return {
      data,
      total,
    };
  }

  /**
   * Lista paginada do catalogo de conquistas ativas (com o tema associado).
   *
   * @param paginacao Parametros de paginacao (skip/take).
   * @returns Pagina de conquistas ativas e o total.
   */
  async listarConquistas(paginacao: ParametrosPaginacao) {
    const [data, total] = await prisma.$transaction([
      prisma.conquista.findMany({
        where: {
          ativo: true,
        },

        include: {
          tema: true,
        },

        skip: paginacao.skip,
        take: paginacao.limit,

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.conquista.count({
        where: {
          ativo: true,
        },
      }),
    ]);

    return {
      data,
      total,
    };
  }
}
