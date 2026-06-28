import type { Papel } from "@/shared/constants/papeis";
import type { Status } from "@/shared/constants/status";

// Conteudo do JWT decodificado (claims do usuario).
export type PayloadAutenticacao = {
  id: string;
  email: string;
  papel: Papel;
  status: Status;
};

// Usuario autenticado anexado a request apos a validacao do token.
export type UsuarioAutenticado = {
  id: string;
  email: string;
  papel: Papel;
  status: Status;
};
