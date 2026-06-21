import { TipoItemLoja } from "@prisma/client";

import { LojaService } from "@/modules/loja/loja.service";
import type {
  InventarioBanco,
  ItemLojaBanco,
  LojaRepository,
} from "@/modules/loja/loja.repository";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

function criarItemLoja(overrides: Partial<ItemLojaBanco> = {}): ItemLojaBanco {
  const agora = new Date("2026-06-16T00:00:00.000Z");

  return {
    id: "item-loja-id",
    codigo: "icone-coruja-sabia",
    nome: "Coruja Sábia",
    descricao: "Ícone de perfil para os estudiosos de plantão.",
    tipo: TipoItemLoja.ICONE_PERFIL,
    precoMoedas: 1,
    valor: null,
    imagemUrl: null,
    previewImagemUrl: null,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
    excluidoEm: null,
    ...overrides,
  };
}

function criarInventario(overrides: Partial<InventarioBanco> = {}): InventarioBanco {
  const agora = new Date("2026-06-16T00:00:00.000Z");
  const itemLoja = criarItemLoja();

  return {
    id: "inventario-id",
    usuarioId: "usuario-id",
    itemLojaId: itemLoja.id,
    equipado: false,
    adquiridoEm: agora,
    criadoEm: agora,
    atualizadoEm: agora,
    excluidoEm: null,
    itemLoja,
    ...overrides,
  };
}

function criarRepositoryMock() {
  return {
    listarCatalogo: jest.fn<LojaRepository["listarCatalogo"]>(),
    listarInventario: jest.fn<LojaRepository["listarInventario"]>(),
    comprarItem: jest.fn<LojaRepository["comprarItem"]>(),
  } as unknown as jest.Mocked<LojaRepository>;
}

describe("Testa Loja Service", () => {
  let repository: jest.Mocked<LojaRepository>;
  let service: LojaService;

  beforeEach(() => {
    repository = criarRepositoryMock();
    service = new LojaService(repository);
    jest.clearAllMocks();
  });

  test("deve listar catalogo marcando item adquirido", async () => {
    const item = criarItemLoja();

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
    const item = criarItemLoja();

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
    const inventario = criarInventario();

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
        id: inventario.itemLoja.id,
        codigo: inventario.itemLoja.codigo,
      },
    });
  });

  test("deve comprar item com sucesso", async () => {
    const inventario = criarInventario();

    repository.comprarItem.mockResolvedValue({
      saldoMoedas: 4900,
      inventarioItem: inventario,
    });

    const resultado = await service.comprar("usuario-id", "item-loja-id");

    expect(repository.comprarItem).toHaveBeenCalledWith("usuario-id", "item-loja-id");

    expect(resultado).toEqual({
      mensagem: "Item comprado com sucesso.",
      saldoMoedas: 4900,
      item: expect.objectContaining({
        id: inventario.id,
        item: expect.objectContaining({
          id: inventario.itemLoja.id,
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
    await expect(service.comprar(undefined, "item-loja-id")).rejects.toBeInstanceOf(ErroAplicacao);

    expect(repository.comprarItem).not.toHaveBeenCalled();
  });
});
