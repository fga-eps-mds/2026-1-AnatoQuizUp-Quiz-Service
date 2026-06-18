import { TierConquista, TipoConquista } from "@prisma/client";

export const CONFIG_TIERS: Partial<Record<TipoConquista, Record<TierConquista, number>>> = {
  TOTAL_ACERTOS: {
    [TierConquista.BRONZE]: 10,
    [TierConquista.PRATA]: 50,
    [TierConquista.OURO]: 100,
  },

  STREAK_ACERTOS: {
    [TierConquista.BRONZE]: 5,
    [TierConquista.PRATA]: 10,
    [TierConquista.OURO]: 20,
  },

  TOTAL_ACERTOS_TEMA: {
    [TierConquista.BRONZE]: 10,
    [TierConquista.PRATA]: 50,
    [TierConquista.OURO]: 100,
  },
};
