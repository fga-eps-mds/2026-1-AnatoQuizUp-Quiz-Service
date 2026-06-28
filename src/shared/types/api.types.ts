// Contratos genericos das respostas da API (sucesso, paginada e erro).

// Envelope de sucesso: mensagem + dados tipados.
export type RespostaApiSucesso<T> = {
  mensagem: string;

  dados: T;
};

// Metadados de paginacao retornados junto das listagens.
export type MetadadosPaginacao = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
};

// Resposta paginada: a pagina de dados mais seus metadados.
export type RespostaPaginada<T> = {
  dados: T[];

  metadados: MetadadosPaginacao;
};

// Envelope de erro padronizado da API.
export type RespostaApiErro = {
  erro: {
    codigo: string;

    mensagem: string;

    detalhes?: unknown;
  };
};
