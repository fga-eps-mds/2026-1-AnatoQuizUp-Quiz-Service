import type { TipoItemLoja } from "@prisma/client";

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
  adquirido: boolean;
};

export type InventarioItemDto = {
  id: string;
  equipado: boolean;
  adquiridoEm: Date;
  item: Omit<ItemLojaDto, "adquirido">;
};

export type CompraItemDto = {
  mensagem: string;
  saldoMoedas: number;
  item: InventarioItemDto;
};
