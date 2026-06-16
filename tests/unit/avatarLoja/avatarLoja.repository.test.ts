import { prisma } from "@/config/db";
import { AvatarLojaRepository } from "@/modules/avatarLoja/avatarLoja.repository";
import { FonteMoeda, RaridadeItemAvatar, TipoItemAvatar } from "@prisma/client";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

jest.mock("@/config/db", () => ({
  prisma: {
    $transaction: jest.fn(),

    itemAvatarLoja: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },

    inventarioAvatarItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },

    carteiraMoedas: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },

    transacaoMoeda: {
      create: jest.fn(),
    },
  },
}));

const transactionMock = prisma.$transaction as jest.Mock;

function criarItemAvatar(overrides = {}) {
  const agora = new Date("2026-06-16T00:00:00.000Z");

  return {
    id: "item-avatar-id",
    codigo: "cabelo-curto-classico",
    nome: "Cabelo Curto Clássico",
    descricao: "Um corte simples e elegante para o avatar.",
    tipo: TipoItemAvatar.CABELO,
    raridade: RaridadeItemAvatar.COMUM,
    precoMoedas: 100,
    imagemUrl: null,
    previewImagemUrl: null,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
    excluidoEm: null,
    ...overrides,
  };
}

function criarInventarioAvatar(itemAvatarLoja = criarItemAvatar()) {
  const agora = new Date("2026-06-16T00:00:00.000Z");

  return {
    id: "inventario-id",
    usuarioId: "usuario-id",
    itemAvatarLojaId: itemAvatarLoja.id,
    equipado: false,
    adquiridoEm: agora,
    criadoEm: agora,
    atualizadoEm: agora,
    excluidoEm: null,
    itemAvatarLoja,
  };
}

describe("Testa AvatarLoja Repository", () => {
  let repository: AvatarLojaRepository;

  beforeEach(() => {
    repository = new AvatarLojaRepository();
    jest.clearAllMocks();
  });

  test("deve listar catalogo com filtros e itens adquiridos", async () => {
    const item = criarItemAvatar();
    const registros = [item];
    const totalRegistros = 1;

    transactionMock.mockResolvedValue([registros, totalRegistros]);

    (prisma.inventarioAvatarItem.findMany as jest.Mock).mockResolvedValue([
      {
        itemAvatarLojaId: item.id,
      },
    ]);

    const resultado = await repository.listarCatalogo(
      "usuario-id",
      {
        page: 1,
        limit: 10,
        skip: 0,
      },
      {
        tipo: TipoItemAvatar.CABELO,
        raridade: RaridadeItemAvatar.COMUM,
      },
    );

    expect(prisma.itemAvatarLoja.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ativo: true,
          excluidoEm: null,
          tipo: TipoItemAvatar.CABELO,
          raridade: RaridadeItemAvatar.COMUM,
        }),
        skip: 0,
        take: 10,
        orderBy: [{ tipo: "asc" }, { precoMoedas: "asc" }, { nome: "asc" }],
      }),
    );

    expect(prisma.itemAvatarLoja.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ativo: true,
          excluidoEm: null,
          tipo: TipoItemAvatar.CABELO,
          raridade: RaridadeItemAvatar.COMUM,
        }),
      }),
    );

    expect(prisma.inventarioAvatarItem.findMany).toHaveBeenCalledWith({
      where: {
        usuarioId: "usuario-id",
        itemAvatarLojaId: {
          in: [item.id],
        },
      },
      select: {
        itemAvatarLojaId: true,
      },
    });

    expect(resultado).toEqual({
      data: registros,
      total: totalRegistros,
      itensAdquiridos: new Set([item.id]),
    });
  });

  test("deve listar inventario do usuario", async () => {
    const inventario = criarInventarioAvatar();

    transactionMock.mockResolvedValue([[inventario], 1]);

    const resultado = await repository.listarInventario(
      "usuario-id",
      {
        page: 1,
        limit: 10,
        skip: 0,
      },
    );

    const where = {
      usuarioId: "usuario-id",
      excluidoEm: null,
      itemAvatarLoja: {
        excluidoEm: null,
      },
    };

    expect(prisma.inventarioAvatarItem.findMany).toHaveBeenCalledWith({
      where,
      include: {
        itemAvatarLoja: true,
      },
      skip: 0,
      take: 10,
      orderBy: {
        adquiridoEm: "desc",
      },
    });

    expect(prisma.inventarioAvatarItem.count).toHaveBeenCalledWith({ where });

    expect(resultado).toEqual({
      data: [inventario],
      total: 1,
    });
  });

  test("deve comprar item com sucesso", async () => {
    const item = criarItemAvatar();
    const inventario = criarInventarioAvatar(item);

    const tx = {
      itemAvatarLoja: {
        findUnique: jest.fn().mockResolvedValue(item),
      },
      inventarioAvatarItem: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(inventario),
      },
      carteiraMoedas: {
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({ saldo: 4900 }),
      },
      transacaoMoeda: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    transactionMock.mockImplementation(async (callback) => callback(tx));

    const resultado = await repository.comprarItem("usuario-id", item.id);

    expect(tx.itemAvatarLoja.findUnique).toHaveBeenCalledWith({
      where: {
        id: item.id,
      },
    });

    expect(tx.inventarioAvatarItem.createMany).toHaveBeenCalledWith({
      data: [
        {
          usuarioId: "usuario-id",
          itemAvatarLojaId: item.id,
        },
      ],
      skipDuplicates: true,
    });

    expect(tx.carteiraMoedas.upsert).toHaveBeenCalledWith({
      where: {
        usuarioId: "usuario-id",
      },
      create: {
        usuarioId: "usuario-id",
        saldo: 0,
      },
      update: {},
    });

    expect(tx.carteiraMoedas.updateMany).toHaveBeenCalledWith({
      where: {
        usuarioId: "usuario-id",
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

    expect(tx.transacaoMoeda.create).toHaveBeenCalledWith({
      data: {
        usuarioId: "usuario-id",
        itemAvatarLojaId: item.id,
        quantidade: -item.precoMoedas,
        fonte: FonteMoeda.COMPRA_ITEM_AVATAR,
        descricao: `Compra do item de avatar: ${item.nome}`,
      },
    });

    expect(tx.carteiraMoedas.findUnique).toHaveBeenCalledWith({
      where: {
        usuarioId: "usuario-id",
      },
      select: {
        saldo: true,
      },
    });

    expect(tx.inventarioAvatarItem.findUniqueOrThrow).toHaveBeenCalledWith({
      where: {
        usuarioId_itemAvatarLojaId: {
          usuarioId: "usuario-id",
          itemAvatarLojaId: item.id,
        },
      },
      include: {
        itemAvatarLoja: true,
      },
    });

    expect(resultado).toEqual({
      saldoMoedas: 4900,
      inventarioItem: inventario,
    });
  });

  test("deve lançar erro quando item nao existir", async () => {
    const tx = {
      itemAvatarLoja: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    transactionMock.mockImplementation(async (callback) => callback(tx));

    await expect(repository.comprarItem("usuario-id", "item-inexistente")).rejects.toBeInstanceOf(
      ErroAplicacao,
    );
  });

  test("deve lançar erro quando item estiver inativo", async () => {
    const item = criarItemAvatar({
      ativo: false,
    });

    const tx = {
      itemAvatarLoja: {
        findUnique: jest.fn().mockResolvedValue(item),
      },
    };

    transactionMock.mockImplementation(async (callback) => callback(tx));

    await expect(repository.comprarItem("usuario-id", item.id)).rejects.toBeInstanceOf(
      ErroAplicacao,
    );
  });

  test("deve lançar erro quando item ja tiver sido adquirido", async () => {
    const item = criarItemAvatar();

    const tx = {
      itemAvatarLoja: {
        findUnique: jest.fn().mockResolvedValue(item),
      },
      inventarioAvatarItem: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      carteiraMoedas: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      transacaoMoeda: {
        create: jest.fn(),
      },
    };

    transactionMock.mockImplementation(async (callback) => callback(tx));

    await expect(repository.comprarItem("usuario-id", item.id)).rejects.toBeInstanceOf(
      ErroAplicacao,
    );

    expect(tx.carteiraMoedas.updateMany).not.toHaveBeenCalled();
    expect(tx.transacaoMoeda.create).not.toHaveBeenCalled();
  });

  test("deve lançar erro quando saldo for insuficiente", async () => {
    const item = criarItemAvatar();

    const tx = {
      itemAvatarLoja: {
        findUnique: jest.fn().mockResolvedValue(item),
      },
      inventarioAvatarItem: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      carteiraMoedas: {
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      transacaoMoeda: {
        create: jest.fn(),
      },
    };

    transactionMock.mockImplementation(async (callback) => callback(tx));

    await expect(repository.comprarItem("usuario-id", item.id)).rejects.toBeInstanceOf(
      ErroAplicacao,
    );

    expect(tx.transacaoMoeda.create).not.toHaveBeenCalled();
  });
});