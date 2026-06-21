import type { ItemLoja } from "@prisma/client";

export interface RequisicaoEquiparItem {
  itemLojaId: string;
}

export interface RespostaInventario {
  id: string;
  equipado: boolean;
  itemLoja: ItemLoja;
}