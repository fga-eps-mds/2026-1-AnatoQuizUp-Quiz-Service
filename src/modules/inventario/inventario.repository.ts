import { prisma } from "@/config/db";
import type { TipoItemLoja } from "@prisma/client";

export class InventarioRepository {
  async buscarItemNoInventario(usuarioId: string, itemLojaId: string) {
    return prisma.inventarioItem.findFirst({
      where: {
        usuarioId,
        itemLojaId,
        excluidoEm: null,
        itemLoja: {
          ativo: true,
          excluidoEm: null,
        },
      },
      include: {
        itemLoja: true,
      },
    });
  }

  async equiparItemTransacao(usuarioId: string, inventarioItemId: string, tipoItem: TipoItemLoja) {
    const itensDesseTipo = await prisma.inventarioItem.findMany({
      where: {
        usuarioId,
        excluidoEm: null,
        itemLoja: {
          tipo: tipoItem,
          ativo: true,
          excluidoEm: null,
        },
      },
      select: { id: true },
    });

    const idsParaDesequipar = itensDesseTipo.map((item) => item.id);

    return prisma.$transaction([
      prisma.inventarioItem.updateMany({
        where: {
          id: { in: idsParaDesequipar },
        },
        data: {
          equipado: false,
        },
      }),
      prisma.inventarioItem.update({
        where: {
          id: inventarioItemId,
        },
        data: {
          equipado: true,
        },
      }),
    ]);
  }

  async desequiparItem(inventarioItemId: string) {
    return prisma.inventarioItem.update({
      where: { id: inventarioItemId },
      data: { equipado: false },
    });
  }

  async listarItensEquipados(usuarioId: string) {
    return prisma.inventarioItem.findMany({
      where: {
        usuarioId,
        equipado: true,
        excluidoEm: null,
        itemLoja: {
          ativo: true,
          excluidoEm: null,
        },
      },
      include: {
        itemLoja: true,
      },
    });
  }

  async listarItensEquipadosUsuarios(usuarioIds: string[]) {
    return prisma.inventarioItem.findMany({
      where: {
        usuarioId: {
          in: usuarioIds,
        },
        equipado: true,
        excluidoEm: null,
        itemLoja: {
          ativo: true,
          excluidoEm: null,
        },
      },
      select: {
        usuarioId: true,
        itemLoja: true,
      },
      orderBy: {
        adquiridoEm: "desc",
      },
    });
  }

  async listarInventarioCompleto(usuarioId: string) {
    return prisma.inventarioItem.findMany({
      where: {
        usuarioId,
        excluidoEm: null,
        itemLoja: {
          ativo: true,
          excluidoEm: null,
        },
      },
      include: {
        itemLoja: true,
      },
    });
  }
}
