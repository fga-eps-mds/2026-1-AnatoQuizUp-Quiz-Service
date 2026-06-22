import type { RespostaPaginada } from "@/shared/types/api.types";
import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { MENSAGENS } from "@/shared/constants/mensagens";

import type { InventarioBanco, ItemLojaBanco, LojaRepository } from "./loja.repository";
import type { CompraItemDto, InventarioItemDto, ItemLojaDto } from "./dto/loja.dto";
import type { ListarCatalogoQueryDto, ListarInventarioQueryDto } from "./loja.schemas";

export class LojaService {
  constructor(private readonly lojaRepository: LojaRepository) {}

  async listarCatalogo(
    usuarioId: string | undefined,
    query: ListarCatalogoQueryDto,
  ): Promise<RespostaPaginada<ItemLojaDto>> {
    this.validarUsuarioAutenticado(usuarioId);

    const paginacao = resolverParametrosPaginacao(query);

    const { data, total, itensAdquiridos } = await this.lojaRepository.listarCatalogo(
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
    query: ListarInventarioQueryDto,
  ): Promise<RespostaPaginada<InventarioItemDto>> {
    this.validarUsuarioAutenticado(usuarioId);

    const paginacao = resolverParametrosPaginacao(query);

    const { data, total } = await this.lojaRepository.listarInventario(usuarioId, paginacao);

    return {
      dados: data.map((item) => this.converterInventario(item)),
      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  async comprar(usuarioId: string | undefined, itemLojaId: string): Promise<CompraItemDto> {
    this.validarUsuarioAutenticado(usuarioId);

    const compra = await this.lojaRepository.comprarItem(usuarioId, itemLojaId);

    return {
      mensagem: "Item comprado com sucesso.",
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

  private converterItemLoja(item: ItemLojaBanco, adquirido: boolean): ItemLojaDto {
    return {
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      descricao: item.descricao,
      tipo: item.tipo,
      precoMoedas: item.precoMoedas,
      valor: item.valor,
      imagemUrl: item.imagemUrl,
      previewImagemUrl: item.previewImagemUrl,
      ativo: item.ativo,
      disponivelNaLoja: item.disponivelNaLoja,
      adquirido,
    };
  }

  private converterInventario(item: InventarioBanco): InventarioItemDto {
    return {
      id: item.id,
      equipado: item.equipado,
      origem: item.origem,
      adquiridoEm: item.adquiridoEm,
      item: {
        id: item.itemLoja.id,
        codigo: item.itemLoja.codigo,
        nome: item.itemLoja.nome,
        descricao: item.itemLoja.descricao,
        tipo: item.itemLoja.tipo,
        precoMoedas: item.itemLoja.precoMoedas,
        valor: item.itemLoja.valor,
        imagemUrl: item.itemLoja.imagemUrl,
        previewImagemUrl: item.itemLoja.previewImagemUrl,
        ativo: item.itemLoja.ativo,
        disponivelNaLoja: item.itemLoja.disponivelNaLoja,
      },
    };
  }
}
