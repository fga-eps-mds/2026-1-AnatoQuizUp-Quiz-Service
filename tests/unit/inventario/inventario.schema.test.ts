import { schemaEquiparItem } from "../../../src/modules/inventario/inventario.schema";

describe("Inventario Schemas", () => {
  describe("schemaEquiparItem", () => {
    it("deve validar com sucesso quando itemLojaId é uma string válida", () => {
      const payload = { itemLojaId: "item-123" };
      const resultado = schemaEquiparItem.safeParse(payload);
      
      expect(resultado.success).toBe(true);
    });

    it("deve falhar quando itemLojaId é uma string vazia", () => {
      const payload = { itemLojaId: "" };
      const resultado = schemaEquiparItem.safeParse(payload);
      
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.error.issues[0].message).toBe("O ID do item da loja é obrigatório.");
      }
    });

    it("deve falhar quando itemLojaId não é uma string", () => {
      const payload = { itemLojaId: 12345 };
      const resultado = schemaEquiparItem.safeParse(payload);
      
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.error.issues[0].message).toBe("O ID do item deve ser uma string.");
      }
    });

    it("deve falhar quando itemLojaId está ausente", () => {
      const payload = {};
      const resultado = schemaEquiparItem.safeParse(payload);
      
      expect(resultado.success).toBe(false);
    });
  });
});