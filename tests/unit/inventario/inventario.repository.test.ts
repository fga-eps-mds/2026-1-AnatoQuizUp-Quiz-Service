import { PrismaClient, TipoItemLoja } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const mockPrismaInstance = {
    inventarioItem: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
    TipoItemLoja: {
      ICONE_PERFIL: "ICONE_PERFIL",
    },
  };
});

import { InventarioRepository } from "../../../src/modules/inventario/inventario.repository";

type PrismaMock = {
  inventarioItem: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe("InventarioRepository", () => {
  let repository: InventarioRepository;
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrisma = new PrismaClient() as unknown as PrismaMock;
    repository = new InventarioRepository();
  });

  describe("buscarItemNoInventario", () => {
    it("deve chamar findFirst com os parâmetros corretos", async () => {
      const mockItem = { id: "inv-1", equipado: false, itemLoja: {} };
      mockPrisma.inventarioItem.findFirst.mockResolvedValue(mockItem);

      const resultado = await repository.buscarItemNoInventario("user-1", "item-1");

      expect(mockPrisma.inventarioItem.findFirst).toHaveBeenCalledWith({
        where: {
          usuarioId: "user-1",
          itemLojaId: "item-1",
          excluidoEm: null,
          itemLoja: { ativo: true, excluidoEm: null },
        },
        include: { itemLoja: true },
      });
      expect(resultado).toEqual(mockItem);
    });
  });

  describe("equiparItemTransacao", () => {
    it("deve executar a transação desequipando itens antigos e equipando o novo", async () => {
      const itensDesseTipo = [{ id: "inv-antigo-1" }];
      mockPrisma.inventarioItem.findMany.mockResolvedValue(itensDesseTipo);
      mockPrisma.$transaction.mockResolvedValue([{ count: 1 }, { id: "inv-novo" }]);

      await repository.equiparItemTransacao("user-1", "inv-novo", TipoItemLoja.ICONE_PERFIL);

      expect(mockPrisma.inventarioItem.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: "user-1",
          excluidoEm: null,
          itemLoja: {
            tipo: TipoItemLoja.ICONE_PERFIL,
            ativo: true,
            excluidoEm: null,
          },
        },
        select: { id: true },
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      
      const transacaoArgs = mockPrisma.$transaction.mock.calls[0][0] as unknown[];
      expect(transacaoArgs).toHaveLength(2);
    });
  });

  describe("desequiparItem", () => {
    it("deve chamar update marcando o item como não equipado", async () => {
      const atualizado = { id: "inv-1", equipado: false };
      mockPrisma.inventarioItem.update.mockResolvedValue(atualizado);

      const resultado = await repository.desequiparItem("inv-1");

      expect(mockPrisma.inventarioItem.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { equipado: false },
      });
      expect(resultado).toEqual(atualizado);
    });
  });

  describe("listarItensEquipados", () => {
    it("deve chamar findMany buscando apenas itens equipados do usuário", async () => {
      const mockLista = [{ id: "inv-1" }, { id: "inv-2" }];
      mockPrisma.inventarioItem.findMany.mockResolvedValue(mockLista);

      const resultado = await repository.listarItensEquipados("user-1");

      expect(mockPrisma.inventarioItem.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: "user-1",
          equipado: true,
          excluidoEm: null,
          itemLoja: { ativo: true, excluidoEm: null },
        },
        include: { itemLoja: true },
      });
      expect(resultado).toEqual(mockLista);
    });
  });
});
