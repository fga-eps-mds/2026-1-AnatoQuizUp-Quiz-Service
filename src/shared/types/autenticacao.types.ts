import type { Papel } from "@/shared/constants/papeis";
import type { Status } from "@/shared/constants/status";

export type PayloadAutenticacao = {
  id: string;
  email: string;
  papel: Papel;
  status: Status;
};

export type UsuarioAutenticado = {
  id: string;
  email: string;
  papel: Papel;
  status: Status;
};
