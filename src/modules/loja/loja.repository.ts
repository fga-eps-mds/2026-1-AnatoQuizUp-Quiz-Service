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

// Repository da loja de cosmeticos (Prisma): catalogo, inventario e compra de itens.
export class LojaRepository {
  /**
   * Lista o catalogo de itens a venda, marcando quais o usuario ja possui.
   *
   * @param usuarioId Usuario (para cruzar com o inventario).
   * @param paginacao Skip/take.
   * @param filtros Filtro opcional por tipo de item.
   * @returns Pagina de itens, total e o conjunto de ids ja adquiridos pelo usuario.
   */
  async listarCatalogo(
    usuarioId: string,
    paginacao: ParametrosPaginacao,
    filtros: ListarCatalogoQueryDto,
  ) {
    // So itens ativos, disponiveis na loja e nao excluidos (filtro opcional por tipo).
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

    // Conjunto de ids ja no inventario, para o service marcar "adquirido" no catalogo.
    const itensAdquiridos = new Set(inventario.map((item) => item.itemLojaId));

    return {
      data: itens,
      total,
      itensAdquiridos,
    };
  }

  // Lista paginada do inventario do usuario (itens nao excluidos), recentes primeiro.
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

  /**
   * Compra um item da loja de forma atomica e segura contra concorrencia.
   *
   * Valida o item (existe, ativo, compravel), evita compra duplicada (createMany com
   * skipDuplicates), debita o saldo so se for suficiente (updateMany condicional) e
   * registra a transacao de moedas. Qualquer falha aborta toda a compra.
   *
   * @param usuarioId Comprador.
   * @param itemLojaId Item desejado.
   * @returns Saldo atualizado e o item adicionado ao inventario.
   * @throws ErroAplicacao 404/422/409 conforme item invalido, saldo ou duplicidade.
   */
  async comprarItem(usuarioId: string, itemLojaId: string) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.itemLoja.findUnique({
        where: { id: itemLojaId },
      });

      // Item precisa existir e nao estar excluido.
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

      // Adiciona ao inventario; skipDuplicates impede comprar o mesmo item duas vezes.
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

      // Nada criado = ja possui o item: conflito.
      if (inventarioCriado.count === 0) {
        throw new ErroAplicacao({
          codigoStatus: 409,
          codigo: CodigoDeErro.CONFLITO,
          mensagem: "Este item ja foi adquirido pelo aluno.",
        });
      }

      // Garante a carteira antes de tentar debitar.
      await tx.carteiraMoedas.upsert({
        where: { usuarioId },
        create: {
          usuarioId,
          saldo: 0,
        },
        update: {},
      });

      // Debita o preco somente se o saldo for suficiente (condicao no proprio where),
      // o que evita corrida de saldo negativo sem precisar de lock explicito.
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

      // Nenhuma linha atualizada = saldo insuficiente.
      if (carteiraAtualizada.count === 0) {
        throw new ErroAplicacao({
          codigoStatus: 422,
          codigo: CodigoDeErro.REQUISICAO_INVALIDA,
          mensagem: "Saldo de moedas insuficiente para comprar este item.",
        });
      }

      // Registra a transacao de moedas (negativa, pois e um gasto).
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
