import { FonteMoeda, type Prisma } from "@prisma/client";

import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";
import type {
  ListarCatalogoAvatarQueryDto,
} from "./avatarLoja.schemas";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

type ItemAvatarBanco = Prisma.ItemAvatarLojaGetPayload<object>;

type InventarioAvatarBanco = Prisma.InventarioAvatarItemGetPayload<{
  include: {
    itemAvatarLoja: true;
  };
}>;

export class AvatarLojaRepository {
  async listarCatalogo(
    usuarioId: string,
    paginacao: ParametrosPaginacao,
    filtros: ListarCatalogoAvatarQueryDto,
  ) {
    const where: Prisma.ItemAvatarLojaWhereInput = {
      ativo: true,
      excluidoEm: null,
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.raridade && { raridade: filtros.raridade }),
    };

    const [itens, total] = await prisma.$transaction([
      prisma.itemAvatarLoja.findMany({
        where,
        skip: paginacao.skip,
        take: paginacao.limit,
        orderBy: [{ tipo: "asc" }, { precoMoedas: "asc" }, { nome: "asc" }],
      }),
      prisma.itemAvatarLoja.count({ where }),
    ]);

    const inventario = await prisma.inventarioAvatarItem.findMany({
      where: {
        usuarioId,
        itemAvatarLojaId: {
          in: itens.map((item) => item.id),
        },
      },
      select: {
        itemAvatarLojaId: true,
      },
    });

    const itensAdquiridos = new Set(inventario.map((item) => item.itemAvatarLojaId));

    return {
      data: itens,
      total,
      itensAdquiridos,
    };
  }

  async listarInventario(
    usuarioId: string,
    paginacao: ParametrosPaginacao,
  ) {
    const where: Prisma.InventarioAvatarItemWhereInput = {
      usuarioId,
      excluidoEm: null,
      itemAvatarLoja: {
        excluidoEm: null,
      },
    };

    const [data, total] = await prisma.$transaction([
      prisma.inventarioAvatarItem.findMany({
        where,
        include: {
          itemAvatarLoja: true,
        },
        skip: paginacao.skip,
        take: paginacao.limit,
        orderBy: {
          adquiridoEm: "desc",
        },
      }),
      prisma.inventarioAvatarItem.count({ where }),
    ]);

    return { data, total };
  }

  async comprarItem(usuarioId: string, itemAvatarLojaId: string) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.itemAvatarLoja.findUnique({
        where: { id: itemAvatarLojaId },
      });

      if (!item || item.excluidoEm !== null) {
        throw new ErroAplicacao({
          codigoStatus: 404,
          codigo: CodigoDeErro.NAO_ENCONTRADO,
          mensagem: "Item de avatar nao encontrado.",
        });
      }

      if (!item.ativo) {
        throw new ErroAplicacao({
          codigoStatus: 422,
          codigo: CodigoDeErro.REQUISICAO_INVALIDA,
          mensagem: "Este item de avatar nao esta disponivel para compra.",
        });
      }

      const inventarioCriado = await tx.inventarioAvatarItem.createMany({
        data: [
          {
            usuarioId,
            itemAvatarLojaId,
          },
        ],
        skipDuplicates: true,
      });

      if (inventarioCriado.count === 0) {
        throw new ErroAplicacao({
          codigoStatus: 409,
          codigo: CodigoDeErro.CONFLITO,
          mensagem: "Este item de avatar ja foi adquirido pelo aluno.",
        });
      }

      await tx.carteiraMoedas.upsert({
        where: { usuarioId },
        create: {
          usuarioId,
          saldo: 0,
        },
        update: {},
      });

      const carteiraAtualizada = await tx.carteiraMoedas.updateMany({
        where: {
          usuarioId,
          saldo: {
            gte: item.precoMoedas,
          },
        },
        data: {
          saldo: {
            decrement: item.precoMoedas,
          },
        },
      });

      if (carteiraAtualizada.count === 0) {
        throw new ErroAplicacao({
          codigoStatus: 422,
          codigo: CodigoDeErro.REQUISICAO_INVALIDA,
          mensagem: "Saldo de moedas insuficiente para comprar este item.",
        });
      }

      await tx.transacaoMoeda.create({
        data: {
          usuarioId,
          itemAvatarLojaId,
          quantidade: -item.precoMoedas,
          fonte: FonteMoeda.COMPRA_ITEM_AVATAR,
          descricao: `Compra do item de avatar: ${item.nome}`,
        },
      });

      const carteira = await tx.carteiraMoedas.findUnique({
        where: { usuarioId },
        select: { saldo: true },
      });

      const inventarioItem = await tx.inventarioAvatarItem.findUniqueOrThrow({
        where: {
          usuarioId_itemAvatarLojaId: {
            usuarioId,
            itemAvatarLojaId,
          },
        },
        include: {
          itemAvatarLoja: true,
        },
      });

      return {
        saldoMoedas: carteira?.saldo ?? 0,
        inventarioItem,
      };
    });
  }
}

export type { ItemAvatarBanco, InventarioAvatarBanco };