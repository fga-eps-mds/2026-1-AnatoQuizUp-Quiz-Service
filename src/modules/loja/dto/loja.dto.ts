import type { OrigemItemInventario, TipoItemLoja } from "@prisma/client";

// DTOs do modulo de loja.

// Item do catalogo; "adquirido" indica se o usuario atual ja o possui.
export type ItemLojaDto = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: TipoItemLoja;
  precoMoedas: number;
  valor: string | null;
  imagemUrl: string | null;
  previewImagemUrl: string | null;
  ativo: boolean;
  disponivelNaLoja: boolean;
  adquirido: boolean;
};

// Item ja possuido pelo usuario (no inventario); aqui "adquirido" e implicito.
export type InventarioItemDto = {
  id: string;
  equipado: boolean;
  origem: OrigemItemInventario;
  adquiridoEm: Date;
  item: Omit<ItemLojaDto, "adquirido">;
};

// Resultado de uma compra: mensagem, saldo atualizado e item adquirido.
export type CompraItemDto = {
  mensagem: string;
  saldoMoedas: number;
  item: InventarioItemDto;
};
