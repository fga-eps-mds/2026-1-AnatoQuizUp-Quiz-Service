import type { TipoItemLoja } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class InventarioRepository {
  async buscarItemNoInventario(usuarioId: string, itemLojaId: string) {
    return prisma.inventarioItem.findUnique({
      where: {
        usuarioId_itemLojaId: {
          usuarioId,
          itemLojaId,
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
        itemLoja: {
          tipo: tipoItem,
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

  async listarItensEquipados(usuarioId: string) {
    return prisma.inventarioItem.findMany({
      where: {
        usuarioId,
        equipado: true,
      },
      include: {
        itemLoja: true,
      },
    });
  }

  async listarInventarioCompleto(usuarioId: string) {
    return prisma.inventarioItem.findMany({
      where: {
        usuarioId,
      },
      include: {
        itemLoja: true,
      },
    });
  }
}