import { eventEmitter } from "@/shared/events/event-emitter";

import { ConquistaRepository } from "../conquistas.repository";
import { ConquistaService } from "../conquistas.service";

const conquistaService = new ConquistaService(new ConquistaRepository());

eventEmitter.on(
  "tema.criado",
  async ({ temaId, nomeTema }: { temaId: string; nomeTema: string }) => {
    await conquistaService.criarConquistaPadraoTema(temaId, nomeTema);
  },
);
