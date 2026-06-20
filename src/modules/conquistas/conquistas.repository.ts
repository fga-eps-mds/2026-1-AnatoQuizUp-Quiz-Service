import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";
import { type TierConquista, TipoConquista } from "@prisma/client";

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

  async criarDesbloqueio(usuarioId: string, conquistaId: string, tier: TierConquista) {
    return prisma.desbloqueioConquista.create({
      data: {
        usuarioId,
        conquistaId,
        tier,
      },

      include: {
        conquista: true,
      },
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
      prisma.conquistaUsuario.findMany({
        where: {
          usuarioId,
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
                select: {
                  tier: true,
                  conquistadoEm: true,
                },
              },
            },
          },
        },

        skip: paginacao.skip,
        take: paginacao.limit,

        orderBy: {
          atualizadoEm: "desc",
        },
      }),

      prisma.conquistaUsuario.count({
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
