import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";
import {
  FonteMoeda,
  OrigemItemInventario,
  type TierConquista,
  TipoConquista,
} from "@prisma/client";

export class ConquistaRepository {
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

  async buscarConquistaTotalAcertos() {
    return prisma.conquista.findFirst({
      where: {
        tipoConquista: TipoConquista.TOTAL_ACERTOS,
        ativo: true,
      },
    });
  }

  async buscarConquistaStreak() {
    return prisma.conquista.findFirst({
      where: {
        tipoConquista: TipoConquista.STREAK_ACERTOS,
        ativo: true,
      },
    });
  }

  async buscarConquistaTema(temaId: string) {
    return prisma.conquista.findFirst({
      where: {
        tipoConquista: TipoConquista.TOTAL_ACERTOS_TEMA,
        temaId,
        ativo: true,
      },
    });
  }

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

  async criarDesbloqueioComRecompensas(
    usuarioId: string,
    conquistaId: string,
    tier: TierConquista,
    quantidadeMoedas: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const desbloqueioCriado = await tx.desbloqueioConquista.createMany({
        data: {
          usuarioId,
          conquistaId,
          tier,
        },
        skipDuplicates: true,
      });

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

      await tx.carteiraMoedas.upsert({
        where: { usuarioId },
        create: { usuarioId, saldo: 0 },
        update: {},
      });

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

  async contarConquistasDestacadas(usuarioId: string) {
    return prisma.desbloqueioConquista.count({
      where: {
        usuarioId,
        destaque: true,
      },
    });
  }

  async buscarDesbloqueioPorId(usuarioId: string, desbloqueioId: string) {
    return prisma.desbloqueioConquista.findFirst({
      where: {
        id: desbloqueioId,
        usuarioId,
      },
    });
  }

  async buscarConquistasDestacadas(usuarioId: string) {
    return prisma.desbloqueioConquista.findMany({
      where: {
        usuarioId,
        destaque: true,
      },

      include: {
        conquista: true,
      },

      orderBy: {
        conquistadoEm: "desc",
      },
    });
  }

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
          tema: {
            select: {
              id: true,
              nome: true,
            },
          },
          usuarios: {
            where: {
              usuarioId,
            },
            select: {
              valorProgresso: true,
            },
            take: 1,
          },
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
