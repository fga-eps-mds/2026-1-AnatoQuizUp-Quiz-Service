import type { Request, Response, NextFunction } from "express";
import { InventarioController } from "../../../src/modules/inventario/inventario.controller";
import { InventarioService } from "../../../src/modules/inventario/inventario.service";
import type { InventarioRepository } from "../../../src/modules/inventario/inventario.repository";

jest.mock("../../../src/modules/inventario/inventario.service");

type MockRequest = Partial<Request> & {
  usuario?: { id: string };
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

describe("InventarioController", () => {
  let controller: InventarioController;
  let serviceMock: jest.Mocked<InventarioService>;
  
  let req: MockRequest;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    serviceMock = new InventarioService({} as InventarioRepository) as jest.Mocked<InventarioService>;
    controller = new InventarioController(serviceMock);

    req = {
      usuario: { id: "user-1" },
      headers: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  describe("equipar", () => {
    it("deve chamar o service corretamente e retornar 200", async () => {
      req.body = { itemLojaId: "item-1" };
      const mockRespostaService = { mensagem: "Sucesso", dados: { itemNome: "Coruja", categoria: "ICONE_PERFIL" as const } };
      
      serviceMock.equiparItem.mockResolvedValue(mockRespostaService);

      await controller.equipar(req as unknown as Request, res as Response, next);

      expect(serviceMock.equiparItem).toHaveBeenCalledWith("user-1", "item-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRespostaService);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve capturar erros do service e repassar para o next", async () => {
      req.body = { itemLojaId: "item-1" };
      const erroSimulado = new Error("Erro de teste");
      
      serviceMock.equiparItem.mockRejectedValue(erroSimulado);

      await controller.equipar(req as unknown as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(erroSimulado);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("meuPerfil", () => {
    it("deve buscar o perfil equipado e retornar 200", async () => {
      const mockRespostaService = { mensagem: "Sucesso", dados: [] };
      serviceMock.obterPerfilEquipado.mockResolvedValue(mockRespostaService);

      await controller.meuPerfil(req as unknown as Request, res as Response, next);

      expect(serviceMock.obterPerfilEquipado).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRespostaService);
    });

    it("deve usar o id do header caso nao venha no req.usuario", async () => {
      req.usuario = undefined;
      req.headers = { "x-user-id": "user-header" };
      
      const mockRespostaService = { mensagem: "Sucesso", dados: [] };
      serviceMock.obterPerfilEquipado.mockResolvedValue(mockRespostaService);

      await controller.meuPerfil(req as unknown as Request, res as Response, next);

      expect(serviceMock.obterPerfilEquipado).toHaveBeenCalledWith("user-header");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});