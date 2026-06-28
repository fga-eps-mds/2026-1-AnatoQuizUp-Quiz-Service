import type { CorsOptions } from "cors";

import { MENSAGENS } from "@/shared/constants/mensagens";

import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";

import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

// Converte a string de origens do .env (separadas por virgula) em lista limpa.
export function parseCorsOrigins(value: string): string[] {
  return value

    .split(",")

    .map((origin) => origin.trim())

    .filter(Boolean);
}

// Monta as opcoes de CORS: libera requisicoes sem origin (ex.: server-to-server)
// e as origens da allowlist; demais sao rejeitadas com erro 403.
export function criarOpcoesCors(origensPermitidas: string[]): CorsOptions {
  return {
    origin(origin, callback) {
      if (!origin || origensPermitidas.includes(origin)) {
        callback(null, true);

        return;
      }

      // Origem fora da allowlist: bloqueia com erro padronizado.
      callback(
        new ErroAplicacao({
          codigoStatus: 403,

          codigo: CodigoDeErro.PROIBIDO,

          mensagem: MENSAGENS.origemCorsNaoPermitida,

          detalhes: {
            origin,
          },
        }),
      );
    },
  };
}
