import { TierConquista, type TipoConquista } from "@prisma/client";

// Configuracao das conquistas: objetivos de cada tier e recompensa em ATP.

// Objetivo (valor a atingir) por tipo de conquista e por tier (bronze/prata/ouro)
export const CONFIG_TIERS: Partial<Record<TipoConquista, Record<TierConquista, number>>> = {
  // Total de acertos acumulados no quiz inteiro.
  TOTAL_ACERTOS: {
    [TierConquista.BRONZE]: 5,
    [TierConquista.PRATA]: 50,
    [TierConquista.OURO]: 100,
  },

  // Sequencia de acertos consecutivos sem errar.
  STREAK_ACERTOS: {
    [TierConquista.BRONZE]: 5,
    [TierConquista.PRATA]: 10,
    [TierConquista.OURO]: 20,
  },

  // Acertos acumulados dentro de um mesmo tema.
  TOTAL_ACERTOS_TEMA: {
    [TierConquista.BRONZE]: 5,
    [TierConquista.PRATA]: 50,
    [TierConquista.OURO]: 100,
  },
};

// Moedas (ATP) creditadas ao desbloquear cada tier.
export const ATP_POR_TIER_DESBLOQUEIO: Record<TierConquista, number> = {
  [TierConquista.BRONZE]: 30,
  [TierConquista.PRATA]: 50,
  [TierConquista.OURO]: 70,
};
