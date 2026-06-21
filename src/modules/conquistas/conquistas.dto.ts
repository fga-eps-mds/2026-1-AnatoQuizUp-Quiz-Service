import type { TierConquista, TipoConquista, TipoItemLoja } from "@prisma/client";

export type ItemExclusivoConcedidoDto = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: TipoItemLoja;
  valor: string | null;
  imagemUrl: string | null;
  previewImagemUrl: string | null;
};

export type ConquistaDesbloqueadaDto = {
  conquistaId: string;
  desbloqueioId: string;
  nome: string;
  descricao: string;
  tier: TierConquista;
  tipoConquista: TipoConquista;
  temaId?: string | null;
  moedasConcedidas: number;
  saldoMoedas: number;
  itemConcedido: ItemExclusivoConcedidoDto | null;
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
