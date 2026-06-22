import type { InventarioRepository } from "./inventario.repository";
import { ErroAplicacao } from "../../shared/errors/erro-aplicacao";

export class InventarioService {
  constructor(private inventarioRepository: InventarioRepository) {}

  async equiparItem(usuarioId: string, itemLojaId: string) {
    const itemInventario = await this.inventarioRepository.buscarItemNoInventario(
      usuarioId,
      itemLojaId,
    );

    if (!itemInventario) {
      throw new ErroAplicacao({
        codigo: "NAO_ENCONTRADO",
        codigoStatus: 404,
        mensagem: "Item não encontrado no seu inventário.",
      });
    }

    if (itemInventario.equipado) {
      throw new ErroAplicacao({
        codigo: "REQUISICAO_INVALIDA",
        codigoStatus: 400,
        mensagem: "Este item já está equipado.",
      });
    }

    const tipoItem = itemInventario.itemLoja.tipo;

    await this.inventarioRepository.equiparItemTransacao(usuarioId, itemInventario.id, tipoItem);

    return {
      mensagem: "Item equipado com sucesso.",
      dados: {
        itemNome: itemInventario.itemLoja.nome,
        categoria: tipoItem,
      },
    };
  }

  async obterPerfilEquipado(usuarioId: string) {
    const itensEquipados = await this.inventarioRepository.listarItensEquipados(usuarioId);

    const itensFormatados = itensEquipados.map((inv) => inv.itemLoja);

    return {
      mensagem: "Perfil personalizado recuperado com sucesso.",
      dados: itensFormatados,
    };
  }

  async obterPerfisEquipados(usuarioIds: string[]) {
    const itensEquipados = await this.inventarioRepository.listarItensEquipadosUsuarios(usuarioIds);

    const dados = Object.fromEntries(usuarioIds.map((usuarioId) => [usuarioId, [] as unknown[]]));

    for (const item of itensEquipados) {
      dados[item.usuarioId].push(item.itemLoja);
    }

    return {
      mensagem: "Perfis personalizados recuperados com sucesso.",
      dados,
    };
  }

  async obterInventarioCompleto(usuarioId: string) {
    const itensInventario = await this.inventarioRepository.listarInventarioCompleto(usuarioId);

    const itensFormatados = itensInventario.map((inv) => ({
      inventarioId: inv.id,
      equipado: inv.equipado,
      origem: inv.origem,
      ...inv.itemLoja,
    }));

    return {
      mensagem: "Inventário recuperado com sucesso.",
      dados: itensFormatados,
    };
  }
}
