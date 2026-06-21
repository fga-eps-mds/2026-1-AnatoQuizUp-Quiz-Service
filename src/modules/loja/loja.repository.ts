import { FonteMoeda, OrigemItemInventario, type Prisma } from "@prisma/client";

import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";
import type { ListarCatalogoQueryDto } from "./loja.schemas";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

type ItemLojaBanco = Prisma.ItemLojaGetPayload<object>;

type InventarioBanco = Prisma.InventarioItemGetPayload<{
  include: {
    itemLoja: true;
  };
}>;

export class LojaRepository {
  async listarCatalogo(
    usuarioId: string,
    paginacao: ParametrosPaginacao,
    filtros: ListarCatalogoQueryDto,
  ) {
    const where: Prisma.ItemLojaWhereInput = {
      ativo: true,
      disponivelNaLoja: true,
      excluidoEm: null,
      ...(filtros.tipo && { tipo: filtros.tipo }),
    };

    const [itens, total] = await prisma.$transaction([
      prisma.itemLoja.findMany({
        where,
        skip: paginacao.skip,
        take: paginacao.limit,
        orderBy: [{ tipo: "asc" }, { precoMoedas: "asc" }, { nome: "asc" }],
      }),
      prisma.itemLoja.count({ where }),
    ]);

    const inventario = await prisma.inventarioItem.findMany({
      where: {
        usuarioId,
        itemLojaId: {
          in: itens.map((item) => item.id),
        },
      },
      select: {
        itemLojaId: true,
      },
    });

    const itensAdquiridos = new Set(inventario.map((item) => item.itemLojaId));

    return {
      data: itens,
      total,
      itensAdquiridos,
    };
  }

  async listarInventario(usuarioId: string, paginacao: ParametrosPaginacao) {
    const where: Prisma.InventarioItemWhereInput = {
      usuarioId,
      excluidoEm: null,
      itemLoja: {
        excluidoEm: null,
      },
    };

    const [data, total] = await prisma.$transaction([
      prisma.inventarioItem.findMany({
        where,
        include: {
          itemLoja: true,
        },
        skip: paginacao.skip,
        take: paginacao.limit,
        orderBy: {
          adquiridoEm: "desc",
        },
      }),
      prisma.inventarioItem.count({ where }),
    ]);

    return { data, total };
  }

  async comprarItem(usuarioId: string, itemLojaId: string) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.itemLoja.findUnique({
        where: { id: itemLojaId },
      });

      if (!item || item.excluidoEm !== null) {
        throw new ErroAplicacao({
          codigoStatus: 404,
          codigo: CodigoDeErro.NAO_ENCONTRADO,
          mensagem: "Item nao encontrado.",
        });
      }

      if (!item.ativo) {
        throw new ErroAplicacao({
          codigoStatus: 422,
          codigo: CodigoDeErro.REQUISICAO_INVALIDA,
          mensagem: "Este item nao esta disponivel para compra.",
        });
      }

      if (!item.disponivelNaLoja) {
        throw new ErroAplicacao({
          codigoStatus: 422,
          codigo: CodigoDeErro.REQUISICAO_INVALIDA,
          mensagem: "Este item e exclusivo de conquista e nao pode ser comprado.",
        });
      }

      const inventarioCriado = await tx.inventarioItem.createMany({
        data: [
          {
            usuarioId,
            itemLojaId,
            origem: OrigemItemInventario.COMPRA,
          },
        ],
        skipDuplicates: true,
      });

      if (inventarioCriado.count === 0) {
        throw new ErroAplicacao({
          codigoStatus: 409,
          codigo: CodigoDeErro.CONFLITO,
          mensagem: "Este item ja foi adquirido pelo aluno.",
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
          itemLojaId,
          quantidade: -item.precoMoedas,
          fonte: FonteMoeda.COMPRA_ITEM,
          descricao: `Compra do item: ${item.nome}`,
        },
      });

      const carteira = await tx.carteiraMoedas.findUnique({
        where: { usuarioId },
        select: { saldo: true },
      });

      const inventarioItem = await tx.inventarioItem.findUniqueOrThrow({
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

      return {
        saldoMoedas: carteira?.saldo ?? 0,
        inventarioItem,
      };
    });
  }
}

export type { ItemLojaBanco, InventarioBanco };
