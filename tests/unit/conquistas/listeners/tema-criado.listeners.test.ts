import type { EventEmitter } from "node:stream";

const mockCriarConquistaPadraoTema = jest.fn();

describe("evento tema.criado - Conquistas", () => {
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("deve chamar criarConquistaPadraoTema", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@/modules/conquistas/conquistas.service", () => ({
        ConquistaService: jest.fn().mockImplementation(() => ({
          criarConquistaPadraoTema: mockCriarConquistaPadraoTema,
        })),
      }));

      jest.doMock("@/modules/conquistas/conquistas.repository", () => ({
        ConquistaRepository: jest.fn(),
      }));

      await import("@/modules/conquistas/listeners/tema-criado.listener");

      const mod = await import("@/shared/events/event-emitter");
      eventEmitter = mod.eventEmitter;
    });

    eventEmitter.emit("tema.criado", {
      temaId: "tema-1",
      nomeTema: "Torax",
    });

    await new Promise(setImmediate);

    expect(mockCriarConquistaPadraoTema).toHaveBeenCalledWith(
      "tema-1",
      "Torax",
    );
  });
});