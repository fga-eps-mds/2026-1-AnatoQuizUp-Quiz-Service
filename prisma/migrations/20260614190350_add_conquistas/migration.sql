-- CreateEnum
CREATE TYPE "TipoConquista" AS ENUM ('STREAK_ACERTOS', 'TOTAL_ACERTOS', 'TOTAL_ACERTOS_TEMA', 'PERCENTUAL_ACERTO_TEMA');

-- CreateEnum
CREATE TYPE "TierConquista" AS ENUM ('BRONZE', 'PRATA', 'OURO');

-- CreateTable
CREATE TABLE "conquistas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipoConquista" "TipoConquista" NOT NULL,
    "temaId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conquistas_usuarios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "conquistaId" TEXT NOT NULL,
    "valorProgresso" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conquistas_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desbloqueios_conquistas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "conquistaId" TEXT NOT NULL,
    "tier" "TierConquista" NOT NULL,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "conquistadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desbloqueios_conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conquistas_tipoConquista_idx" ON "conquistas"("tipoConquista");

-- CreateIndex
CREATE INDEX "conquistas_temaId_idx" ON "conquistas"("temaId");

-- CreateIndex
CREATE INDEX "conquistas_usuarios_usuarioId_idx" ON "conquistas_usuarios"("usuarioId");

-- CreateIndex
CREATE INDEX "conquistas_usuarios_conquistaId_idx" ON "conquistas_usuarios"("conquistaId");

-- CreateIndex
CREATE UNIQUE INDEX "conquistas_usuarios_usuarioId_conquistaId_key" ON "conquistas_usuarios"("usuarioId", "conquistaId");

-- CreateIndex
CREATE INDEX "desbloqueios_conquistas_usuarioId_idx" ON "desbloqueios_conquistas"("usuarioId");

-- CreateIndex
CREATE INDEX "desbloqueios_conquistas_conquistaId_idx" ON "desbloqueios_conquistas"("conquistaId");

-- CreateIndex
CREATE UNIQUE INDEX "desbloqueios_conquistas_usuarioId_conquistaId_tier_key" ON "desbloqueios_conquistas"("usuarioId", "conquistaId", "tier");

-- AddForeignKey
ALTER TABLE "conquistas" ADD CONSTRAINT "conquistas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conquistas_usuarios" ADD CONSTRAINT "conquistas_usuarios_conquistaId_fkey" FOREIGN KEY ("conquistaId") REFERENCES "conquistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desbloqueios_conquistas" ADD CONSTRAINT "desbloqueios_conquistas_conquistaId_fkey" FOREIGN KEY ("conquistaId") REFERENCES "conquistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
