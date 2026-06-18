import { TierConquista, TipoConquista } from "@prisma/client";

export type ConquistaDesbloqueadaDto = {
  conquistaId: string;
  nome: string;
  descricao: string;
  tier: string;
};

export type ResumoConquistaDto = {
  id: string;
  nome: string;
  descricao: string;
  tipoConquista: TipoConquista;
  temaId?: string | null;
};

export type ResumoConquistaDesbloqueadaDto = {
  id: string;
  nome: string;
  descricao: string;
  tier: TierConquista;
  destaque: boolean;
  conquistadoEm: Date;
};

export type ProgressoConquistaDto = {
  id: string;
  valor_progresso: number;
  nome: string;
  descricao: string;
  tipoConquista: TipoConquista;
  desbloqueios: {
    tier: TierConquista;
    conquistadoEm: Date;
  }[];
};

export type PaginacaoQueryDto = {
  page?: number;
  limit?: number;
};

export type AlterarDestaqueConquistaDto = {
  destaque: boolean;
};
