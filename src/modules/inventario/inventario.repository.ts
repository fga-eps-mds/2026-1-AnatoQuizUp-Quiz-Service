import { prisma } from "@/config/db";
import type { TipoItemLoja } from "@prisma/client";

// Repository de inventario (Prisma): equipar/desequipar e listar itens, sempre
// considerando apenas itens ativos e nao excluidos.
export class InventarioRepository {
  // Busca um item especifico no inventario do usuario (ativo e nao excluido).
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

  /**
   * Equipa um item garantindo exclusividade por tipo (so um equipado por categoria).
   *
   * Numa transacao: desequipa todos os itens do mesmo tipo do usuario e equipa o alvo.
   *
   * @param usuarioId Dono do inventario.
   * @param inventarioItemId Item a equipar.
   * @param tipoItem Tipo/categoria do item (avatar, moldura etc.).
   */
  async equiparItemTransacao(usuarioId: string, inventarioItemId: string, tipoItem: TipoItemLoja) {
    // Coleta os itens do mesmo tipo para desequipa-los antes de equipar o novo.
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

  // Desequipa um item especifico.
  async desequiparItem(inventarioItemId: string) {
    return prisma.inventarioItem.update({
      where: { id: inventarioItemId },
      data: { equipado: false },
    });
  }

  // Lista os itens atualmente equipados do usuario (perfil personalizado).
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

  // Itens equipados de varios usuarios de uma vez (usado pelo ranking/perfil social).
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

  // Lista o inventario inteiro do usuario (equipados e nao equipados).
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
