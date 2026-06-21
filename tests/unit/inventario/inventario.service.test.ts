import { InventarioService } from "../../../src/modules/inventario/inventario.service";
import { InventarioRepository } from "../../../src/modules/inventario/inventario.repository";
import { ErroAplicacao } from "../../../src/shared/errors/erro-aplicacao";
import type { ItemLoja } from "@prisma/client";
import { TipoItemLoja } from "@prisma/client";

jest.mock("../../../src/modules/inventario/inventario.repository");

describe("InventarioService", () => {
  let service: InventarioService;
  let repositoryMock: jest.Mocked<InventarioRepository>;

  beforeEach(() => {
    repositoryMock = new InventarioRepository() as jest.Mocked<InventarioRepository>;
    service = new InventarioService(repositoryMock);
  });

  describe("equiparItem", () => {
    it("deve lançar ErroAplicacao 404 se o item não for encontrado no inventário", async () => {
      repositoryMock.buscarItemNoInventario.mockResolvedValue(null);

      await expect(service.equiparItem("user-1", "item-nao-existe")).rejects.toThrow(ErroAplicacao);
      await expect(service.equiparItem("user-1", "item-nao-existe")).rejects.toMatchObject({
        codigoStatus: 404,
      });
    });

    it("deve lançar ErroAplicacao 400 se o item já estiver equipado", async () => {
      repositoryMock.buscarItemNoInventario.mockResolvedValue({
        id: "inv-1",
        usuarioId: "user-1",
        itemLojaId: "item-1",
        equipado: true,
        adquiridoEm: new Date(),
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        excluidoEm: null,
        itemLoja: {} as ItemLoja,
      });

      await expect(service.equiparItem("user-1", "item-1")).rejects.toThrow(ErroAplicacao);
      await expect(service.equiparItem("user-1", "item-1")).rejects.toMatchObject({
        codigoStatus: 400,
      });
    });

    it("deve equipar o item com sucesso se as validações passarem", async () => {
      const mockItemInventario = {
        id: "inv-1",
        usuarioId: "user-1",
        itemLojaId: "item-1",
        equipado: false,
        adquiridoEm: new Date(),
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        excluidoEm: null,
        itemLoja: {
          nome: "Coruja",
          tipo: TipoItemLoja.ICONE_PERFIL,
        } as ItemLoja,
      };

      repositoryMock.buscarItemNoInventario.mockResolvedValue(mockItemInventario);
      repositoryMock.equiparItemTransacao.mockResolvedValue([
        { count: 1 }, 
        { ...mockItemInventario, equipado: true }
      ]);

      const resultado = await service.equiparItem("user-1", "item-1");

      expect(repositoryMock.equiparItemTransacao).toHaveBeenCalledWith("user-1", "inv-1", TipoItemLoja.ICONE_PERFIL);
      expect(resultado).toEqual({
        mensagem: "Item equipado com sucesso.",
        dados: {
          itemNome: "Coruja",
          categoria: TipoItemLoja.ICONE_PERFIL,
        },
      });
    });
  });

  describe("obterPerfilEquipado", () => {
    it("deve retornar apenas os itens da loja que estão equipados", async () => {
      const mockItensLoja = [
        { nome: "Coruja", tipo: TipoItemLoja.ICONE_PERFIL } as ItemLoja,
        { nome: "Bronze", tipo: TipoItemLoja.MOLDURA } as ItemLoja,
      ];

      repositoryMock.listarItensEquipados.mockResolvedValue([
        { 
          id: "inv-1", usuarioId: "user-1", itemLojaId: "item-1", equipado: true, adquiridoEm: new Date(), criadoEm: new Date(), atualizadoEm: new Date(), excluidoEm: null,
          itemLoja: mockItensLoja[0] 
        },
        { 
          id: "inv-2", usuarioId: "user-1", itemLojaId: "item-2", equipado: true, adquiridoEm: new Date(), criadoEm: new Date(), atualizadoEm: new Date(), excluidoEm: null,
          itemLoja: mockItensLoja[1] 
        },
      ]);

      const resultado = await service.obterPerfilEquipado("user-1");

      expect(resultado).toEqual({
        mensagem: "Perfil personalizado recuperado com sucesso.",
        dados: mockItensLoja,
      });
    });
  });
});