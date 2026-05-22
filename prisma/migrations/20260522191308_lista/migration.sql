-- CreateTable
CREATE TABLE "listas_questoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "listas_questoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listas_questoes_itens" (
    "id" TEXT NOT NULL,
    "listaQuestaoId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "listas_questoes_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listas_turmas" (
    "id" TEXT NOT NULL,
    "listaQuestaoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listas_turmas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listas_questoes_itens_listaQuestaoId_questaoId_key" ON "listas_questoes_itens"("listaQuestaoId", "questaoId");

-- CreateIndex
CREATE UNIQUE INDEX "listas_turmas_listaQuestaoId_turmaId_key" ON "listas_turmas"("listaQuestaoId", "turmaId");

-- AddForeignKey
ALTER TABLE "listas_questoes_itens" ADD CONSTRAINT "listas_questoes_itens_listaQuestaoId_fkey" FOREIGN KEY ("listaQuestaoId") REFERENCES "listas_questoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listas_questoes_itens" ADD CONSTRAINT "listas_questoes_itens_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listas_turmas" ADD CONSTRAINT "listas_turmas_listaQuestaoId_fkey" FOREIGN KEY ("listaQuestaoId") REFERENCES "listas_questoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listas_turmas" ADD CONSTRAINT "listas_turmas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
