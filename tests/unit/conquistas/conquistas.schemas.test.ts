import {
  schemaPaginacaoConquistas,
  schemaDesbloqueioId,
  schemaAlterarDestaqueConquista,
} from "@/modules/conquistas/conquistas.schemas";

describe("schemaPaginacaoConquistas", () => {
  test("valida paginação com todos os campos", () => {
    const resultado = schemaPaginacaoConquistas.safeParse({
      page: 1,
      limit: 20,
    });

    expect(resultado.success).toBe(true);
  });

  test("valida paginação sem campos", () => {
    const resultado = schemaPaginacaoConquistas.safeParse({});

    expect(resultado.success).toBe(true);
  });

  test("valida coercao de string para number", () => {
    const resultado = schemaPaginacaoConquistas.safeParse({
      page: "2",
      limit: "10",
    });

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.page).toBe(2);
      expect(resultado.data.limit).toBe(10);
    }
  });

  test("rejeita page menor que 1", () => {
    const resultado = schemaPaginacaoConquistas.safeParse({
      page: 0,
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita limit menor que 1", () => {
    const resultado = schemaPaginacaoConquistas.safeParse({
      limit: 0,
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita limit maior que 100", () => {
    const resultado = schemaPaginacaoConquistas.safeParse({
      limit: 101,
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita page decimal", () => {
    const resultado = schemaPaginacaoConquistas.safeParse({
      page: 1.5,
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita limit decimal", () => {
    const resultado = schemaPaginacaoConquistas.safeParse({
      limit: 10.7,
    });

    expect(resultado.success).toBe(false);
  });
});

describe("schemaDesbloqueioId", () => {
  test("valida id válido", () => {
    const resultado = schemaDesbloqueioId.safeParse({
      id: "abc123",
    });

    expect(resultado.success).toBe(true);
  });

  test("remove espaços do id", () => {
    const resultado = schemaDesbloqueioId.safeParse({
      id: "  abc123  ",
    });

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.id).toBe("abc123");
    }
  });

  test("rejeita id vazio", () => {
    const resultado = schemaDesbloqueioId.safeParse({
      id: "",
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita id só com espaços", () => {
    const resultado = schemaDesbloqueioId.safeParse({
      id: "   ",
    });

    expect(resultado.success).toBe(false);
  });
});

describe("schemaAlterarDestaqueConquista", () => {
  test("aceita destaque true", () => {
    const resultado = schemaAlterarDestaqueConquista.safeParse({
      destaque: true,
    });

    expect(resultado.success).toBe(true);
  });

  test("aceita destaque false", () => {
    const resultado = schemaAlterarDestaqueConquista.safeParse({
      destaque: false,
    });

    expect(resultado.success).toBe(true);
  });

  test("rejeita string ao invés de boolean", () => {
    const resultado = schemaAlterarDestaqueConquista.safeParse({
      destaque: "true",
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita número ao invés de boolean", () => {
    const resultado = schemaAlterarDestaqueConquista.safeParse({
      destaque: 1,
    });

    expect(resultado.success).toBe(false);
  });

  test("rejeita campo vazio", () => {
    const resultado = schemaAlterarDestaqueConquista.safeParse({});

    expect(resultado.success).toBe(false);
  });
});