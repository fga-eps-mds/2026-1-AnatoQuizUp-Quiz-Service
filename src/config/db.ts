import { PrismaClient } from "@prisma/client";

// Singleton do Prisma reutilizado entre hot-reloads no desenvolvimento.
declare global {
  var __prisma__: PrismaClient | undefined;
}

// Reaproveita a instancia global se existir; senao cria uma nova.
const prismaClient =
  global.__prisma__ ??
  new PrismaClient({
    log: ["warn", "error"],
  });

// Fora de producao, guarda no global para evitar multiplas conexoes no reload.
if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prismaClient;
}

export const prisma = prismaClient;

// Abre a conexao com o banco (chamado no boot do servidor).
export async function conectarBancoDeDados() {
  await prisma.$connect();
}

// Fecha a conexao com o banco (usado no encerramento gracioso).
export async function desconectarBancoDeDados() {
  await prisma.$disconnect();
}
