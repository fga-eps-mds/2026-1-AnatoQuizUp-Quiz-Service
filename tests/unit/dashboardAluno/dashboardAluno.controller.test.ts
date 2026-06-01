import type { NextFunction, Request, Response } from "express";

import { DashboardAlunoController } from "@/modules/dashboardAluno/dashboardAluno.controller";
import { DashboardAlunoService } from "@/modules/dashboardAluno/dashboardAluno.service";
import type { DashboardAlunoRepository } from "@/modules/dashboardAluno/dashboardAluno.repository";
import type { DashboardAlunoDto } from "@/modules/dashboardAluno/dto/dashboardAluno.types";

jest.mock("@/modules/dashboardAluno/dashboardAluno.service");

describe("DashboardAlunoController", () => {
  let controller: DashboardAlunoController;
  let serviceMock: jest.Mocked<DashboardAlunoService>;
  let next: NextFunction;

  const criarResponse = (): Response<DashboardAlunoDto> => {
    const response: Partial<Response<DashboardAlunoDto>> = {};
    response.status = jest.fn().mockReturnValue(response);
    response.json = jest.fn().mockReturnValue(response);
    return response as Response<DashboardAlunoDto>;
  };

  beforeEach(() => {
    const repositoryMock = {} as DashboardAlunoRepository;
    serviceMock = new DashboardAlunoService(repositoryMock) as jest.Mocked<DashboardAlunoService>;
    controller = new DashboardAlunoController(serviceMock);
    next = jest.fn();
  });

  it("deve responder 200 com o dashboard do aluno autenticado", async () => {
    const dashboard: DashboardAlunoDto = {
      totalRespondidas: 5,
      totalAcertos: 4,
      totalErros: 1,
      taxaAcerto: 80,
      porTema: [],
    };
    serviceMock.obterDashboard.mockResolvedValue(dashboard);

    const request = { usuario: { id: "aluno-1" } } as unknown as Request;
    const response = criarResponse();

    await controller.obterDashboard(request, response, next);

    expect(serviceMock.obterDashboard).toHaveBeenCalledWith("aluno-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(dashboard);
    expect(next).not.toHaveBeenCalled();
  });

  it("deve repassar o id indefinido para o service quando nao ha usuario", async () => {
    serviceMock.obterDashboard.mockResolvedValue({
      totalRespondidas: 0,
      totalAcertos: 0,
      totalErros: 0,
      taxaAcerto: 0,
      porTema: [],
    });

    const request = {} as Request;
    const response = criarResponse();

    await controller.obterDashboard(request, response, next);

    expect(serviceMock.obterDashboard).toHaveBeenCalledWith(undefined);
  });

  it("deve delegar o erro para o next quando o service falha", async () => {
    const erro = new Error("falha");
    serviceMock.obterDashboard.mockRejectedValue(erro);

    const request = { usuario: { id: "aluno-1" } } as unknown as Request;
    const response = criarResponse();

    await controller.obterDashboard(request, response, next);

    expect(next).toHaveBeenCalledWith(erro);
    expect(response.status).not.toHaveBeenCalled();
  });
});
