import type { RespostaPaginada } from "@/shared/types/api.types";
import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { MENSAGENS } from "@/shared/constants/mensagens";

import type { AvatarLojaRepository, InventarioAvatarBanco, ItemAvatarBanco } from "./avatarLoja.repository";
import type {
  CompraItemAvatarDto,
  InventarioAvatarItemDto,
  ItemAvatarLojaDto,
} from "./dto/avatar_loja.dto";
import type {
  ListarCatalogoAvatarQueryDto,
  ListarInventarioAvatarQueryDto,
} from "./avatarLoja.schemas";

export class AvatarLojaService {
  constructor(private readonly avatarLojaRepository: AvatarLojaRepository) {}

  async listarCatalogo(
    usuarioId: string | undefined,
    query: ListarCatalogoAvatarQueryDto,
  ): Promise<RespostaPaginada<ItemAvatarLojaDto>> {
    this.validarUsuarioAutenticado(usuarioId);

    const paginacao = resolverParametrosPaginacao(query);

    const { data, total, itensAdquiridos } = await this.avatarLojaRepository.listarCatalogo(
      usuarioId,
      paginacao,
      query,
    );

    return {
      dados: data.map((item) => this.converterItemLoja(item, itensAdquiridos.has(item.id))),
      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  async listarInventario(
    usuarioId: string | undefined,
    query: ListarInventarioAvatarQueryDto,
  ): Promise<RespostaPaginada<InventarioAvatarItemDto>> {
    this.validarUsuarioAutenticado(usuarioId);

    const paginacao = resolverParametrosPaginacao(query);

    const { data, total } = await this.avatarLojaRepository.listarInventario(
      usuarioId,
      paginacao
    );

    return {
      dados: data.map((item) => this.converterInventario(item)),
      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  async comprar(
    usuarioId: string | undefined,
    itemAvatarLojaId: string,
  ): Promise<CompraItemAvatarDto> {
    this.validarUsuarioAutenticado(usuarioId);

    const compra = await this.avatarLojaRepository.comprarItem(usuarioId, itemAvatarLojaId);

    return {
      mensagem: "Item de avatar comprado com sucesso.",
      saldoMoedas: compra.saldoMoedas,
      item: this.converterInventario(compra.inventarioItem),
    };
  }

  private validarUsuarioAutenticado(usuarioId: string | undefined): asserts usuarioId is string {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }
  }

  private converterItemLoja(item: ItemAvatarBanco, adquirido: boolean): ItemAvatarLojaDto {
    return {
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      descricao: item.descricao,
      tipo: item.tipo,
      raridade: item.raridade,
      precoMoedas: item.precoMoedas,
      imagemUrl: item.imagemUrl,
      previewImagemUrl: item.previewImagemUrl,
      ativo: item.ativo,
      adquirido,
    };
  }

  private converterInventario(item: InventarioAvatarBanco): InventarioAvatarItemDto {
    return {
      id: item.id,
      equipado: item.equipado,
      adquiridoEm: item.adquiridoEm,
      item: {
        id: item.itemAvatarLoja.id,
        codigo: item.itemAvatarLoja.codigo,
        nome: item.itemAvatarLoja.nome,
        descricao: item.itemAvatarLoja.descricao,
        tipo: item.itemAvatarLoja.tipo,
        raridade: item.itemAvatarLoja.raridade,
        precoMoedas: item.itemAvatarLoja.precoMoedas,
        imagemUrl: item.itemAvatarLoja.imagemUrl,
        previewImagemUrl: item.itemAvatarLoja.previewImagemUrl,
        ativo: item.itemAvatarLoja.ativo,
      },
    };
  }
}