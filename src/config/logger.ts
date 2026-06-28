import pino from "pino";

import pinoHttp from "pino-http";

import { env } from "@/config/env";

// Logger base da aplicacao (Pino): nivel via env e timestamp em ISO.
export const logger = pino({
  level: env.LOG_LEVEL,

  timestamp: pino.stdTimeFunctions.isoTime,

  base: {
    servico: "anatoquizup-api",

    ambiente: env.NODE_ENV,
  },
});

// Middleware de log HTTP: define o nivel pelo status e enxuga req/res no log.
export const loggerHttp = pinoHttp({
  logger,

  // 5xx/erros => error; 4xx => warn; demais => info.
  customLogLevel(_request, response, error) {
    if (error || response.statusCode >= 500) {
      return "error";
    }

    if (response.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },

  // Loga apenas campos essenciais de requisicao e resposta.
  serializers: {
    req(request) {
      return {
        method: request.method,

        url: request.url,
      };
    },

    res(response) {
      return {
        statusCode: response.statusCode,
      };
    },
  },
});
