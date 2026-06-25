import { schemaPontuacoesQuery } from "../../../src/modules/ranking/ranking.schemas";

describe("schemaPontuacoesQuery", () => {
  it("transforma a string em lista de ids, removendo espacos e vazios", () => {
    const resultado = schemaPontuacoesQuery.parse({ usuarioIds: "a, b ,,c" });
    expect(resultado).toEqual({ usuarioIds: ["a", "b", "c"] });
  });

  it("retorna lista vazia quando usuarioIds nao e informado", () => {
    const resultado = schemaPontuacoesQuery.parse({});
    expect(resultado).toEqual({ usuarioIds: [] });
  });
});
