import { aplicacao } from "@/config/app";
import { conectarBancoDeDados, desconectarBancoDeDados } from "@/config/db";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { configurarStorage } from "@/config/storage";

async function iniciarServidor() {
  await conectarBancoDeDados();
  await configurarStorage();

  const servidorHttp = aplicacao.listen(env.PORT, "0.0.0.0", () => {
    logger.info({ port: env.PORT }, "Quiz-Service em execucao.");
  });

  const encerrarServidor = async (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Sinal de encerramento recebido.");

    servidorHttp.close(async () => {
      await desconectarBancoDeDados();
      logger.info("Servidor HTTP encerrado.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void encerrarServidor("SIGINT");
  });

  process.on("SIGTERM", () => {
    void encerrarServidor("SIGTERM");
  });
}

void iniciarServidor().catch(async (error) => {
  logger.error({ error }, "Falha ao iniciar o Quiz-Service.");
  await desconectarBancoDeDados();
  process.exit(1);
});
