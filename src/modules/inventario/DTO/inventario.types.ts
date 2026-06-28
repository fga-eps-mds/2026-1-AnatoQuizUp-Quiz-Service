import type { ItemLoja, OrigemItemInventario } from "@prisma/client";

// DTOs do modulo de inventario.

// Body para equipar um item.
export interface RequisicaoEquiparItem {
  itemLojaId: string;
}

// Item do inventario retornado pela API (com a origem e o item da loja embutido).
export interface RespostaInventario {
  id: string;
  equipado: boolean;
  origem: OrigemItemInventario;
  itemLoja: ItemLoja;
}
