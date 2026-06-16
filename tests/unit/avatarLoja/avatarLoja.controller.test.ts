import type { NextFunction, Request, Response } from "express";

import { AvatarLojaController } from "@/modules/avatarLoja/avatarLoja.controller";
import type { AvatarLojaService } from "@/modules/avatarLoja/avatarLoja.service";

function criarResponseMock<T>() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    response: { status } as unknown as Response<T>,
    status,
    json,
  };
}

describe("Testa AvatarLoja Controller", () => {
  let controller: AvatarLojaController;
  let avatarLojaService: jest.Mocked<AvatarLojaService>;
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    avatarLojaService = {
      listarCatalogo: jest.fn(),
      listarInventario: jest.fn(),
      comprar: jest.fn(),
    } as unknown as jest.Mocked<AvatarLojaService>;

    controller = new AvatarLojaController(avatarLojaService);
    jest.clearAllMocks();
  });

  test("deve listar catalogo com sucesso", async () => {
    const respostaMock = {
      dados: [
        {
          id: "item-id",
          codigo: "cabelo-curto-classico",
          nome: "Cabelo Curto Clássico",
          descricao: null,
          tipo: "CABELO",
          raridade: "COMUM",
          precoMoedas: 100,
          imagemUrl: null,
          previewImagemUrl: null,
          ativo: true,
          adquirido: false,
        },
      ],
      metadados: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    avatarLojaService.listarCatalogo.mockResolvedValue(respostaMock);

    const request = {
      usuario: {
        id: "usuario-id",
      },
      query: {
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock();

    await controller.listarCatalogo(request, response, next);

    expect(avatarLojaService.listarCatalogo).toHaveBeenCalledWith("usuario-id", request.query);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(respostaMock);
  });

  test("deve chamar next quando service lançar erro ao listar catalogo", async () => {
    const erro = new Error("Erro ao listar catalogo");

    avatarLojaService.listarCatalogo.mockRejectedValue(erro);

    const request = {
      usuario: {
        id: "usuario-id",
      },
      query: {},
    } as unknown as Request;

    const { response } = criarResponseMock();
    const nextMock = jest.fn();

    await controller.listarCatalogo(request, response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(erro);
  });

  test("deve listar inventario com sucesso", async () => {
    const respostaMock = {
      dados: [
        {
          id: "inventario-id",
          equipado: false,
          adquiridoEm: new Date("2026-06-16T00:00:00.000Z"),
          item: {
            id: "item-id",
            codigo: "cabelo-curto-classico",
            nome: "Cabelo Curto Clássico",
            descricao: null,
            tipo: "CABELO",
            raridade: "COMUM",
            precoMoedas: 100,
            imagemUrl: null,
            previewImagemUrl: null,
            ativo: true,
          },
        },
      ],
      metadados: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    avatarLojaService.listarInventario.mockResolvedValue(respostaMock);

    const request = {
      usuario: {
        id: "usuario-id",
      },
      query: {},
    } as unknown as Request;

    const { response, status, json } = criarResponseMock();

    await controller.listarInventario(request, response, next);

    expect(avatarLojaService.listarInventario).toHaveBeenCalledWith("usuario-id", request.query);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(respostaMock);
  });

  test("deve comprar item com sucesso", async () => {
    const respostaMock = {
      mensagem: "Item de avatar comprado com sucesso.",
      saldoMoedas: 4900,
      item: {
        id: "inventario-id",
        equipado: false,
        adquiridoEm: new Date("2026-06-16T00:00:00.000Z"),
        item: {
          id: "item-id",
          codigo: "cabelo-curto-classico",
          nome: "Cabelo Curto Clássico",
          descricao: null,
          tipo: "CABELO",
          raridade: "COMUM",
          precoMoedas: 100,
          imagemUrl: null,
          previewImagemUrl: null,
          ativo: true,
        },
      },
    };

    avatarLojaService.comprar.mockResolvedValue(respostaMock);

    const request = {
      usuario: {
        id: "usuario-id",
      },
      body: {
        itemAvatarLojaId: "item-id",
      },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock();

    await controller.comprar(request, response, next);

    expect(avatarLojaService.comprar).toHaveBeenCalledWith("usuario-id", "item-id");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(respostaMock);
  });

  test("deve chamar next quando service lançar erro ao comprar item", async () => {
    const erro = new Error("Erro ao comprar item");

    avatarLojaService.comprar.mockRejectedValue(erro);

    const request = {
      usuario: {
        id: "usuario-id",
      },
      body: {
        itemAvatarLojaId: "item-id",
      },
    } as unknown as Request;

    const { response } = criarResponseMock();
    const nextMock = jest.fn();

    await controller.comprar(request, response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(erro);
  });
});