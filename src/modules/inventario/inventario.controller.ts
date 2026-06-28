import type { Request, Response, NextFunction } from "express";
import type { InventarioService } from "./inventario.service";

// Query com a lista de ids de usuarios (consumida pela rota de perfis equipados).
type UsuariosInventarioQuery = {
  usuarioIds: string[];
};

// Controller HTTP do inventario: itens cosmeticos comprados, equipar/desequipar e perfis.
// Identifica o dono pelo usuario autenticado (req.usuario) e delega ao service.
export class InventarioController {
  constructor(private inventarioService: InventarioService) {}

  /**
   * POST equipa um item do inventario do usuario (ex.: avatar, moldura).
   *
   * @param req Requisicao com o itemLojaId no corpo (usuario vem do token).
   * @param res Resposta HTTP (200 com o resultado).
   * @param next Repasse de erro ao middleware central.
   */
  equipar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario!.id;
      const { itemLojaId } = req.body;

      const resultado = await this.inventarioService.equiparItem(usuarioId, itemLojaId);

      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST desequipa um item atualmente em uso pelo usuario.
   *
   * @param req Requisicao com o itemLojaId no corpo (usuario vem do token).
   * @param res Resposta HTTP (200 com o resultado).
   * @param next Repasse de erro ao middleware central.
   */
  desequipar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario!.id;
      const { itemLojaId } = req.body;

      const resultado = await this.inventarioService.desequiparItem(usuarioId, itemLojaId);

      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET perfil cosmetico do proprio usuario (somente os itens equipados).
   *
   * @param req Requisicao autenticada (usuario vem do token).
   * @param res Resposta HTTP (200 com o perfil equipado).
   * @param next Repasse de erro ao middleware central.
   */
  meuPerfil = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario!.id;

      const resultado = await this.inventarioService.obterPerfilEquipado(usuarioId);

      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET inventario completo do usuario (itens possuidos + estado de equipado).
   *
   * @param req Requisicao autenticada (usuario vem do token).
   * @param res Resposta HTTP (200 com o inventario completo).
   * @param next Repasse de erro ao middleware central.
   */
  meuInventario = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario!.id;

      const resultado = await this.inventarioService.obterInventarioCompleto(usuarioId);

      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET perfis equipados de varios usuarios de uma vez (usado pelo ranking).
   *
   * @param req Requisicao com a lista de usuarioIds na query.
   * @param res Resposta HTTP (200 com os cosmeticos equipados de cada usuario).
   * @param next Repasse de erro ao middleware central.
   */
  perfisEquipados = async (
    req: Request<unknown, unknown, unknown, UsuariosInventarioQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Recebe a lista de ids na query e devolve os cosmeticos equipados de cada um.
      const resultado = await this.inventarioService.obterPerfisEquipados(req.query.usuarioIds);

      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };
}
