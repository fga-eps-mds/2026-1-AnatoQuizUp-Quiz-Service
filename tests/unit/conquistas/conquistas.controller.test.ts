import { ConquistaController } from "@/modules/conquistas/conquistas.controller";
import type { ProgressoConquistaDto, ResumoConquistaDto } from "@/modules/conquistas/conquistas.dto";
import type { ConquistaService } from "@/modules/conquistas/conquistas.service";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type { TierConquista, TipoConquista } from "@prisma/client";
import type { NextFunction, Response, Request } from "express";

function criarResponseMock<T>() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    response: { status } as unknown as Response<T>,
    status,
    json,
  };
}

describe("Testa Conquistas Controller", () => {
  const next = jest.fn() as NextFunction;
  let controller: ConquistaController;
  let conquistaService: jest.Mocked<ConquistaService>;

  beforeEach(() => {
    conquistaService = {
      processarRespostaQuestao: jest.fn(),
      processarTotalAcertos: jest.fn(),
      processarTotalAcertosTema: jest.fn(),
      processarStreak: jest.fn(),
      atualizarConquista: jest.fn(),
      alterarDestaque: jest.fn(),
      buscarConquistasDestacadas: jest.fn(),
      listarProgressoUsuario: jest.fn(),
      listarMeuProgressoEmConquista: jest.fn(),
      listarDesbloqueadasUsuario: jest.fn(),
      listarConquistas: jest.fn(),
    } as unknown as jest.Mocked<ConquistaService>;
    controller = new ConquistaController(conquistaService);
    jest.clearAllMocks();
  });

  test("deve retornar lista de conquistas da plataforma", async () => {
    const mockResposta = {
      dados: [
        {
          id: "conquista-id",
          nome: "conquista-nome",
          descricao: "conquista-nome",
          tipoConquista: "TOTAL_ACERTOS" as TipoConquista,
          temaId: "tema-id",
        },
      ],
      metadados: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    } as unknown as RespostaPaginada<ResumoConquistaDto>;

    conquistaService.listarConquistas.mockResolvedValue(mockResposta);

    const request = {
      usuario: { id: "usuario-id" },
      query: {
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock();

    await controller.listarConquistas(request, response, next);

    expect(conquistaService.listarConquistas).toHaveBeenCalledWith(request.query);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(mockResposta);
  });

  test("deve chamar next quando o service lançar erro ao listar progresso em conquistas do usuário", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      mensagem: MENSAGENS.usuarioNaoEncontrado,
    });
    conquistaService.listarConquistas.mockRejectedValue(error);

    const request = {
      usuario: { id: "usuario-id" },
      query: {
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    const { response } = criarResponseMock();

    await controller.listarConquistas(request, response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("deve retornar progresso do usuário em suas conquistas", async () => {
    const mockResposta = {
      dados: [
        {
          id: "desbloqueio-id",
          nome: "desbloqueio-nome",
          descricao: "descricao-nome",
          tipoConquista: "TOTAL_ACERTOS" as TipoConquista,
          valor_progresso: 10,
          desbloqueios: [{ tier: "BRONZE" as TierConquista, conquistadoEm: new Date() }],
        },
      ],
      metadados: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    } as unknown as RespostaPaginada<ProgressoConquistaDto>;

    conquistaService.listarProgressoUsuario.mockResolvedValue(mockResposta);

    const request = {
      usuario: { id: "usuario-id" },
      query: {
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock();

    await controller.listarMeuProgresso(request, response, next);

    expect(conquistaService.listarProgressoUsuario).toHaveBeenCalledWith(
      request.query,
      "usuario-id",
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(mockResposta);
  });

  test("deve chamar next quando o service lançar erro ao listar progresso em conquistas do usuário", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      mensagem: MENSAGENS.usuarioNaoEncontrado,
    });
    conquistaService.listarProgressoUsuario.mockRejectedValue(error);

    const request = {
      usuario: { id: "usuario-id" },
      query: {
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    const { response } = criarResponseMock();

    await controller.listarMeuProgresso(request, response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("deve retornar progresso do usuário em uma conquista", async () => {
    const mockResposta = {
      id: "desbloqueio-id",
      nome: "desbloqueio-nome",
      descricao: "descricao-nome",
      tipoConquista: "TOTAL_ACERTOS" as TipoConquista,
      valor_progresso: 10,
      desbloqueios: [{ tier: "BRONZE" as TierConquista, conquistadoEm: new Date() }],
    };

    conquistaService.listarMeuProgressoEmConquista.mockResolvedValue(mockResposta);

    const request = {
      usuario: { id: "usuario-id" },
      params: { id: "conquista-id" },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock();

    await controller.listarMeuProgressoEmConquista(request, response, next);

    expect(conquistaService.listarMeuProgressoEmConquista).toHaveBeenCalledWith(
      "usuario-id",
      "conquista-id",
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(mockResposta);
  });

  test("deve chamar next quando o service lançar erro ao buscar progresso do usuário em uma conquista", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      mensagem: MENSAGENS.usuarioNaoEncontrado,
    });
    conquistaService.listarMeuProgressoEmConquista.mockRejectedValue(error);

    const request = {
      usuario: { id: "usuario-id" },
      params: { id: "conquista-id" },
    } as unknown as Request;

    const { response } = criarResponseMock();

    await controller.listarMeuProgressoEmConquista(request, response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("deve listar conquistas do usuário com sucesso", async () => {
    const mockResposta = {
      dados: [
        {
          id: "resposta-id",
          nome: "resposta-nome",
          descricao: "resposta-descricao",
          tier: "BRONZE" as TierConquista,
          destaque: false,
          conquistadoEm: new Date(),
        },
      ],
      metadados: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };
    conquistaService.listarDesbloqueadasUsuario.mockResolvedValue(mockResposta);

    const request = {
      usuario: { id: "usuario-id" },
      query: {
        page: 1,
        limit: 10,
      },
    } as unknown as Request;
    const { response, status, json } = criarResponseMock();

    await controller.listarMinhasConquistas(request, response, next);

    expect(conquistaService.listarDesbloqueadasUsuario).toHaveBeenCalledWith(
      request.query,
      "usuario-id",
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(mockResposta);
  });

  test("deve chamar next quando o service lançar erro ao buscar conquistas do usuário", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      mensagem: MENSAGENS.usuarioNaoEncontrado,
    });
    conquistaService.listarDesbloqueadasUsuario.mockRejectedValue(error);

    const request = {
      usuario: { id: "usuario-id" },
      query: {
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    const { response } = criarResponseMock();

    await controller.listarMinhasConquistas(request, response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("deve retornar conquistas desbloqueadas destacadas pelo usuário", async () => {
    const mockResposta = [
      {
        id: "destaque-id",
        nome: "destaque-nome",
        descricao: "destaque-descricao",
        tier: "BRONZE" as TierConquista,
        conquistadoEm: new Date(),
      },
    ];
    conquistaService.buscarConquistasDestacadas.mockResolvedValue(mockResposta);
    const request = {} as Request;
    const { response, status, json } = criarResponseMock();

    await controller.listarDestacadas(request, response, next);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      mensagem: "Conquistas destacadas encontradas.",
      dados: mockResposta,
    });
  });

  test("deve chamar next quando o service lançar erro ao buscar conquistas destacadas", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      mensagem: MENSAGENS.usuarioNaoEncontrado,
    });
    conquistaService.buscarConquistasDestacadas.mockRejectedValue(error);

    const request = {} as Request;
    const { response } = criarResponseMock();

    await controller.listarDestacadas(request, response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("deve retornar sucesso == True para alterar destaques com sucesso", async () => {
    const mockResposta = { sucesso: true };
    conquistaService.alterarDestaque.mockResolvedValue(mockResposta);

    const request = {
      usuario: { id: "usuario-id" },
      params: { id: "conquista-id" },
      body: {
        destaque: true,
      },
    } as unknown as Request;
    const { response, status, json } = criarResponseMock();

    await controller.alterarDestaque(request, response, next);

    expect(conquistaService.alterarDestaque).toHaveBeenCalledWith(
      "usuario-id",
      "conquista-id",
      true,
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      mensagem: "Destaques alterados com sucesso",
      dados: mockResposta,
    });
  });

  test("deve chamar next quando o service lançar erro ao alterar destaques", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      mensagem: MENSAGENS.usuarioNaoEncontrado,
    });
    conquistaService.alterarDestaque.mockRejectedValue(error);

    const request = {
      params: { id: "id" },
      body: {
        destaque: true,
      },
    } as unknown as Request;

    const { response } = criarResponseMock();

    await controller.alterarDestaque(request, response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
