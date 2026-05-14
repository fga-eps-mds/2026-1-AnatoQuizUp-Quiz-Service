import type { UsuarioAutenticado } from "@/shared/types/autenticacao.types";

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

export {};
