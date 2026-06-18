import cors from "cors";
import express, { Router } from "express";
import helmet from "helmet";

import { criarOpcoesCors } from "@/config/cors";
import { env } from "@/config/env";
import { loggerHttp } from "@/config/logger";
import { questionRouter } from "@/modules/questoes";
import { turmaRouter } from "@/modules/turma";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { middlewareTokenInterno } from "@/shared/middlewares/token-interno.middleware";
import { middlewareTratamentoErros } from "@/shared/middlewares/tratamento-erros.middleware";
import { quizRouter } from "@/modules/quiz/quiz.routes";
import { listaQuestaoRouter } from "@/modules/lista";
import { dashboardRouter } from "@/modules/dashboardTurma/dashboardTurma.routes";
import { dashboardAlunoRouter } from "@/modules/dashboardAluno";
import { resolucaoListaRouter } from "@/modules/resolucaoLista/resolucaoLista.routes";
import { lojaRouter } from "@/modules/loja";

const aplicacao = express();
const roteadorApi = Router();

aplicacao.use(loggerHttp);
aplicacao.use(helmet());
aplicacao.use(cors(criarOpcoesCors(env.CORS_ORIGINS)));
aplicacao.use(express.json());

aplicacao.get("/health", (_request, response) => {
  return response.status(200).json({
    mensagem: MENSAGENS.apiEmExecucao,
    dados: {
      status: "ok",
      servico: "quiz-service",
      timestamp: new Date().toISOString(),
    },
  });
});

aplicacao.use("/api", middlewareTokenInterno);

roteadorApi.use(middlewareAutenticacao);
roteadorApi.use("/quiz", quizRouter);
roteadorApi.use("/questoes", questionRouter);
roteadorApi.use("/turmas", turmaRouter);
roteadorApi.use("/lista", listaQuestaoRouter);
roteadorApi.use("/turmasDashboard", dashboardRouter);
roteadorApi.use("/dashboardAluno", dashboardAlunoRouter);
roteadorApi.use("/listasAluno", resolucaoListaRouter);
roteadorApi.use("/loja", lojaRouter);

aplicacao.use("/api/v1", roteadorApi);

aplicacao.use((_request, _response, next) => {
  next(
    new ErroAplicacao({
      codigoStatus: 404,
      codigo: CodigoDeErro.NAO_ENCONTRADO,
      mensagem: MENSAGENS.rotaNaoEncontrada,
    }),
  );
});

aplicacao.use(middlewareTratamentoErros);

export { aplicacao };