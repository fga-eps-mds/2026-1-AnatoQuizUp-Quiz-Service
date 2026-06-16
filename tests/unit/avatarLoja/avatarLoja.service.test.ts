import { RaridadeItemAvatar, TipoItemAvatar } from "@prisma/client";

import { AvatarLojaService } from "@/modules/avatarLoja/avatarLoja.service";
import type {
  AvatarLojaRepository,
  InventarioAvatarBanco,
  ItemAvatarBanco,
} from "@/modules/avatarLoja/avatarLoja.repository";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

function criarItemAvatar(overrides: Partial<ItemAvatarBanco> = {}): ItemAvatarBanco {
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

function criarInventarioAvatar(
  overrides: Partial<InventarioAvatarBanco> = {},
): InventarioAvatarBanco {
  const agora = new Date("2026-06-16T00:00:00.000Z");
  const itemAvatarLoja = criarItemAvatar();

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
    ...overrides,
  };
}

function criarRepositoryMock() {
  return {
    listarCatalogo: jest.fn<AvatarLojaRepository["listarCatalogo"]>(),
    listarInventario: jest.fn<AvatarLojaRepository["listarInventario"]>(),
    comprarItem: jest.fn<AvatarLojaRepository["comprarItem"]>(),
  } as unknown as jest.Mocked<AvatarLojaRepository>;
}

describe("Testa AvatarLoja Service", () => {
  let repository: jest.Mocked<AvatarLojaRepository>;
  let service: AvatarLojaService;

  beforeEach(() => {
    repository = criarRepositoryMock();
    service = new AvatarLojaService(repository);
    jest.clearAllMocks();
  });

  test("deve listar catalogo marcando item adquirido", async () => {
    const item = criarItemAvatar();

    repository.listarCatalogo.mockResolvedValue({
      data: [item],
      total: 1,
      itensAdquiridos: new Set([item.id]),
    });

    const resultado = await service.listarCatalogo("usuario-id", {
      page: 1,
      limit: 10,
    });

    expect(repository.listarCatalogo).toHaveBeenCalledWith(
      "usuario-id",
      expect.objectContaining({
        page: 1,
        limit: 10,
        skip: 0,
      }),
      expect.objectContaining({
        page: 1,
        limit: 10,
      }),
    );

    expect(resultado).toEqual({
      dados: [
        expect.objectContaining({
          id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          adquirido: true,
        }),
      ],
      metadados: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });

  test("deve listar catalogo marcando item nao adquirido", async () => {
    const item = criarItemAvatar();

    repository.listarCatalogo.mockResolvedValue({
      data: [item],
      total: 1,
      itensAdquiridos: new Set(),
    });

    const resultado = await service.listarCatalogo("usuario-id", {});

    expect(resultado.dados[0]).toMatchObject({
      id: item.id,
      adquirido: false,
    });
  });

  test("deve listar inventario do usuario", async () => {
    const inventario = criarInventarioAvatar();

    repository.listarInventario.mockResolvedValue({
      data: [inventario],
      total: 1,
    });

    const resultado = await service.listarInventario("usuario-id", {
      page: 1,
      limit: 10,
    });

    expect(repository.listarInventario).toHaveBeenCalledWith(
      "usuario-id",
      expect.objectContaining({
        page: 1,
        limit: 10,
        skip: 0,
      }),
    );

    expect(resultado.dados).toHaveLength(1);
    expect(resultado.dados[0]).toMatchObject({
      id: inventario.id,
      equipado: false,
      item: {
        id: inventario.itemAvatarLoja.id,
        codigo: inventario.itemAvatarLoja.codigo,
      },
    });
  });

  test("deve comprar item com sucesso", async () => {
    const inventario = criarInventarioAvatar();

    repository.comprarItem.mockResolvedValue({
      saldoMoedas: 4900,
      inventarioItem: inventario,
    });

    const resultado = await service.comprar("usuario-id", "item-avatar-id");

    expect(repository.comprarItem).toHaveBeenCalledWith("usuario-id", "item-avatar-id");

    expect(resultado).toEqual({
      mensagem: "Item de avatar comprado com sucesso.",
      saldoMoedas: 4900,
      item: expect.objectContaining({
        id: inventario.id,
        item: expect.objectContaining({
          id: inventario.itemAvatarLoja.id,
        }),
      }),
    });
  });

  test("deve lançar erro ao listar catalogo sem usuario autenticado", async () => {
    await expect(service.listarCatalogo(undefined, {})).rejects.toBeInstanceOf(ErroAplicacao);

    expect(repository.listarCatalogo).not.toHaveBeenCalled();
  });

  test("deve lançar erro ao listar inventario sem usuario autenticado", async () => {
    await expect(service.listarInventario(undefined, {})).rejects.toBeInstanceOf(ErroAplicacao);

    expect(repository.listarInventario).not.toHaveBeenCalled();
  });

  test("deve lançar erro ao comprar sem usuario autenticado", async () => {
    await expect(service.comprar(undefined, "item-avatar-id")).rejects.toBeInstanceOf(
      ErroAplicacao,
    );

    expect(repository.comprarItem).not.toHaveBeenCalled();
  });
});