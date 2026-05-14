import jwt from "jsonwebtoken";

import { jwtSecretKey } from "@/config/env";
import { PAPEIS } from "@/shared/constants/papeis";
import { STATUS } from "@/shared/constants/status";
import type { PayloadAutenticacao } from "@/shared/types/autenticacao.types";
import { gerarTokenDeAcesso, verificarTokenJwt } from "@/shared/utils/jwt";

const payloadAutenticacao: PayloadAutenticacao = {
  id: "uuid",
  email: "email@domain",
  papel: PAPEIS.ALUNO,
  status: STATUS.ATIVO,
};

describe("utilitarios JWT do Quiz-Service", () => {
  test("gera token de acesso com sucesso", () => {
    const token = gerarTokenDeAcesso(payloadAutenticacao, jwtSecretKey);
    const tokenVerificado = jwt.verify(token, jwtSecretKey) as PayloadAutenticacao;

    expect(tokenVerificado.id).toEqual("uuid");
  });

  test("verifica token valido com sucesso", () => {
    const token = jwt.sign(payloadAutenticacao, jwtSecretKey);
    const tokenVerificado = verificarTokenJwt(token, jwtSecretKey) as PayloadAutenticacao;

    expect(tokenVerificado.id).toEqual("uuid");
  });

  test("lanca erro de verificacao quando verifica token malformado", () => {
    expect(() => verificarTokenJwt("token-mal-formado", jwtSecretKey)).toThrow("Token invalido");
  });

  test("lanca erro de verificacao quando verifica token expirado", () => {
    const tokenExpirado = jwt.sign(payloadAutenticacao, jwtSecretKey, { expiresIn: "-1s" });

    expect(() => verificarTokenJwt(tokenExpirado, jwtSecretKey)).toThrow("Token expirado");
  });
});
