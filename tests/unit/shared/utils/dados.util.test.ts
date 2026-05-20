import { converterParaIsoString } from "@/shared/utils/dados.util";

describe("dados.util", () => {
  it("converte Date para string ISO", () => {
    expect(converterParaIsoString(new Date("2026-04-25T12:30:00.000Z"))).toBe(
      "2026-04-25T12:30:00.000Z",
    );
  });
});
