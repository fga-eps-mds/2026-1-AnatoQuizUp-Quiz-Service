import { eventEmitter } from "@/shared/events/event-emitter";

import { ConquistaRepository } from "../conquistas.repository";
import { ConquistaService } from "../conquistas.service";

const conquistaService = new ConquistaService(new ConquistaRepository());

// Ao criar um tema, gera automaticamente a conquista padrao associada a ele.
eventEmitter.on(
  "tema.criado",
  async ({ temaId, nomeTema }: { temaId: string; nomeTema: string }) => {
    await conquistaService.criarConquistaPadraoTema(temaId, nomeTema);
  },
);
