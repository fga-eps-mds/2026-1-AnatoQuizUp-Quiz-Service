import type { TierConquista, TipoConquista, TipoItemLoja } from "@prisma/client";

// DTOs (contratos de dados) do modulo de conquistas, trocados entre service e API.

// Item exclusivo concedido ao desbloquear uma conquista (cosmetico de recompensa).
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

// Retorno ao desbloquear: conquista, moedas creditadas, saldo e item ganho.
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

// Resumo de catalogo: dados minimos para listar uma conquista.
export type ResumoConquistaDto = {
  id: string;
  nome: string;
  descricao: string;
  tipoConquista: TipoConquista;
  temaId?: string | null;
};

// Resumo de uma conquista ja desbloqueada pelo aluno (com tier e destaque).
export type ResumoConquistaDesbloqueadaDto = {
  id: string;
  nome: string;
  descricao: string;
  tier: TierConquista;
  destaque: boolean;
  conquistadoEm: Date;
};

// Progresso bruto em uma conquista, com a lista de tiers ja desbloqueados.
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

// Estado de um tier especifico (objetivo, se desbloqueado, recompensas).
export type TierProgressoConquistaDto = {
  tier: TierConquista;
  objetivo: number;
  desbloqueado: boolean;
  desbloqueioId: string | null;
  destaque: boolean;
  conquistadoEm: Date | null;
  moedas: number;
  item: ItemExclusivoConcedidoDto | null;
};

// Visao consolidada para a UI: progresso atual, proximo objetivo e todos os tiers.
export type ProgressoConquistaConsolidadoDto = {
  id: string;
  nome: string;
  descricao: string;
  tipoConquista: TipoConquista;
  tema: {
    id: string;
    nome: string;
  } | null;
  valorProgresso: number;
  proximoTier: TierConquista | null;
  proximoObjetivo: number | null;
  percentual: number;
  tiers: TierProgressoConquistaDto[];
};

// Conquista destacada exibida no perfil social do aluno.
export type ConquistaDestaqueSocialDto = {
  desbloqueioId: string;
  conquistaId: string;
  nome: string;
  descricao: string;
  tier: TierConquista;
  tipoConquista: TipoConquista;
  tema: {
    id: string;
    nome: string;
  } | null;
  conquistadoEm: Date;
};

// Query de paginacao reutilizada nas listagens.
export type PaginacaoQueryDto = {
  page?: number;
  limit?: number;
};

// Body para alterar o destaque de uma conquista.
export type AlterarDestaqueConquistaDto = {
  destaque: boolean;
};
