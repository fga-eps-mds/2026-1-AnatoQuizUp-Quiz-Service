import type { Request, Response, NextFunction } from "express";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { PAPEIS } from "@/shared/constants/papeis";
import type { Papel } from "@/shared/constants/papeis";
import type { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import type { UsuarioAutenticado } from "@/shared/types/autenticacao.types";

const gerarUsuarioAutenticado = (papel: Papel) => {
  const usuario_autenticado: UsuarioAutenticado = {
    id: "uuid",
    email: "email@domain.com",
    papel: papel,
  };
  return usuario_autenticado;
};

describe("Testa middleware de autorização por papéis", () => {
  let mock_request: Partial<Request>;
  let mock_response: Partial<Response>;
  let next_function: NextFunction;

  beforeEach(() => {
    mock_request = {};
    mock_response = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    next_function = jest.fn();
  });

  test("Deve chamar next() caso o papel seja permitido", () => {
    mock_request.usuario = gerarUsuarioAutenticado(PAPEIS.PROFESSOR);
    const middleware = middlewarePapeis(PAPEIS.PROFESSOR, PAPEIS.ADMINISTRADOR);
    middleware(mock_request as Request, mock_response as Response, next_function);
    expect(next_function).toHaveBeenCalled();
  });

  test("Deve lançar 403 caso o papel não seja permitido", () => {
    mock_request.usuario = gerarUsuarioAutenticado(PAPEIS.ALUNO);
    const middleware = middlewarePapeis(PAPEIS.ADMINISTRADOR);
    try {
      middleware(mock_request as Request, mock_response as Response, next_function);
    } catch (erro: unknown) {
      const erroTipado = erro as ErroAplicacao;
      expect(erroTipado.codigoStatus).toBe(403);
      expect(erroTipado.message).toBe("Acesso não autorizado");
    }
  });

  test("Deve lançar 403 caso o papel seja undefined", () => {
    mock_request.usuario = undefined;
    const middleware = middlewarePapeis(PAPEIS.ADMINISTRADOR);
    try {
      middleware(mock_request as Request, mock_response as Response, next_function);
    } catch (erro: unknown) {
      const erroTipado = erro as ErroAplicacao;
      expect(erroTipado.codigoStatus).toBe(403);
      expect(erroTipado.message).toBe("Usuário não autenticado");
    }
  });
});
