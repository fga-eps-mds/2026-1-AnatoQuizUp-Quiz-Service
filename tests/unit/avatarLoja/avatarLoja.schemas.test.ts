import {
  schemaComprarItemAvatar,
  schemaListarCatalogoAvatar,
  schemaListarInventarioAvatar,
} from "@/modules/avatarLoja/avatarLoja.schemas";

describe("Testa AvatarLoja Schemas", () => {
  describe("schemaListarCatalogoAvatar", () => {
    test("deve validar busca de catalogo sem filtros", () => {
      const resultado = schemaListarCatalogoAvatar.safeParse({});

      expect(resultado.success).toBe(true);
    });

    test("deve validar busca de catalogo com filtros", () => {
      const resultado = schemaListarCatalogoAvatar.safeParse({
        tipo: "CABELO",
        raridade: "RARO",
        page: "2",
        limit: "10",
      });

      expect(resultado.success).toBe(true);

      if (resultado.success) {
        expect(resultado.data.page).toBe(2);
        expect(resultado.data.limit).toBe(10);
      }
    });

    test("deve rejeitar tipo invalido", () => {
      const resultado = schemaListarCatalogoAvatar.safeParse({
        tipo: "ESPADA",
      });

      expect(resultado.success).toBe(false);
    });

    test("deve rejeitar raridade invalida", () => {
      const resultado = schemaListarCatalogoAvatar.safeParse({
        raridade: "MITICO",
      });

      expect(resultado.success).toBe(false);
    });

    test("deve rejeitar page menor que 1", () => {
      const resultado = schemaListarCatalogoAvatar.safeParse({
        page: 0,
      });

      expect(resultado.success).toBe(false);
    });

    test("deve rejeitar limit maior que 100", () => {
      const resultado = schemaListarCatalogoAvatar.safeParse({
        limit: 101,
      });

      expect(resultado.success).toBe(false);
    });
  });

  describe("schemaListarInventarioAvatar", () => {
    test("deve validar busca de inventario sem filtros", () => {
      const resultado = schemaListarInventarioAvatar.safeParse({});

      expect(resultado.success).toBe(true);
    });

    test("deve validar coercao de page e limit", () => {
      const resultado = schemaListarInventarioAvatar.safeParse({
        page: "1",
        limit: "10",
      });

      expect(resultado.success).toBe(true);

      if (resultado.success) {
        expect(resultado.data.page).toBe(1);
        expect(resultado.data.limit).toBe(10);
      }
    });

    test("deve rejeitar limit decimal", () => {
      const resultado = schemaListarInventarioAvatar.safeParse({
        limit: 10.5,
      });

      expect(resultado.success).toBe(false);
    });
  });

  describe("schemaComprarItemAvatar", () => {
    test("deve validar compra com itemAvatarLojaId", () => {
      const resultado = schemaComprarItemAvatar.safeParse({
        itemAvatarLojaId: "item-id",
      });

      expect(resultado.success).toBe(true);
    });

    test("deve rejeitar compra sem itemAvatarLojaId", () => {
      const resultado = schemaComprarItemAvatar.safeParse({});

      expect(resultado.success).toBe(false);
    });

    test("deve rejeitar itemAvatarLojaId vazio", () => {
      const resultado = schemaComprarItemAvatar.safeParse({
        itemAvatarLojaId: "",
      });

      expect(resultado.success).toBe(false);
    });
  });
});