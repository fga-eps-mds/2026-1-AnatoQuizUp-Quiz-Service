import type { ValorCodigoDeErro } from "@/shared/errors/codigos-de-erro";

// Parametros para construir um erro de aplicacao.
type ParametrosErroAplicacao = {
  mensagem: string;

  codigo: ValorCodigoDeErro;

  codigoStatus: number;

  detalhes?: unknown;
};

// Erro de dominio com status HTTP e codigo, tratado pelo middleware central.
export class ErroAplicacao extends Error {
  public readonly codigo: ValorCodigoDeErro;

  public readonly codigoStatus: number;

  public readonly detalhes?: unknown;

  constructor({ mensagem, codigo, codigoStatus, detalhes }: ParametrosErroAplicacao) {
    super(mensagem);

    this.name = "ErroAplicacao";

    this.codigo = codigo;

    this.codigoStatus = codigoStatus;

    this.detalhes = detalhes;
  }
}
