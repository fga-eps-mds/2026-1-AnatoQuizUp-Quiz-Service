import type { ItemLoja, OrigemItemInventario } from "@prisma/client";

export interface RequisicaoEquiparItem {
  itemLojaId: string;
}

export interface RespostaInventario {
  id: string;
  equipado: boolean;
  origem: OrigemItemInventario;
  itemLoja: ItemLoja;
}
