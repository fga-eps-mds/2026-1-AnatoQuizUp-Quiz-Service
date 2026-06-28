import { aplicacao } from "@/config/app";
import { conectarBancoDeDados, desconectarBancoDeDados } from "@/config/db";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { configurarStorage } from "@/config/storage";

// Ponto de entrada: conecta dependencias, sobe o HTTP e cuida do encerramento.
async function iniciarServidor() {
  // Garante banco e storage prontos antes de aceitar requisicoes.
  await conectarBancoDeDados();
  await configurarStorage();

  const servidorHttp = aplicacao.listen(env.PORT, "0.0.0.0", () => {
    logger.info({ port: env.PORT }, "Quiz-Service em execucao.");
  });

  // Encerramento gracioso: para de aceitar conexoes e fecha o banco antes de sair.
  const encerrarServidor = async (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Sinal de encerramento recebido.");

    servidorHttp.close(async () => {
      await desconectarBancoDeDados();
      logger.info("Servidor HTTP encerrado.");
      process.exit(0);
    });
  };

  // Sinais de parada (Ctrl+C e orquestrador) disparam o encerramento gracioso.
  process.on("SIGINT", () => {
    void encerrarServidor("SIGINT");
  });

  process.on("SIGTERM", () => {
    void encerrarServidor("SIGTERM");
  });
}

// Se o boot falhar, registra o erro, fecha o banco e sai com codigo de erro.
void iniciarServidor().catch(async (error) => {
  logger.error({ error }, "Falha ao iniciar o Quiz-Service.");
  await desconectarBancoDeDados();
  process.exit(1);
});
