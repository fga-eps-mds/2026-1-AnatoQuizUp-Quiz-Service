import type { RaridadeItemAvatar, TipoItemAvatar } from "@prisma/client";

export type ItemAvatarLojaDto = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: TipoItemAvatar;
  raridade: RaridadeItemAvatar;
  precoMoedas: number;
  imagemUrl: string | null;
  previewImagemUrl: string | null;
  ativo: boolean;
  adquirido: boolean;
};

export type InventarioAvatarItemDto = {
  id: string;
  equipado: boolean;
  adquiridoEm: Date;
  item: Omit<ItemAvatarLojaDto, "adquirido">;
};

export type CompraItemAvatarDto = {
  mensagem: string;
  saldoMoedas: number;
  item: InventarioAvatarItemDto;
};