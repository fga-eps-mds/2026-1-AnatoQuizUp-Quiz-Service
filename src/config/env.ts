import dotenv from "dotenv";
import { z } from "zod";

import { parseCorsOrigins } from "@/config/cors";

dotenv.config();

const ambienteAtual = process.env.NODE_ENV ?? "development";
const ambienteTeste = ambienteAtual === "test";
const DEFAULT_CORS_ORIGINS = "";

const variavelObrigatoria = (nome: string) => z.string().min(1, `${nome} is required.`);
const variavelComDefaultDeTeste = (nome: string, valorPadraoTeste: string) =>
  ambienteTeste ? z.string().min(1).default(valorPadraoTeste) : variavelObrigatoria(nome);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3334),
  DATABASE_URL: variavelComDefaultDeTeste(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/anatoquizup_quiz?schema=public",
  ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  JWT_SECRET_KEY: variavelComDefaultDeTeste("JWT_SECRET_KEY", "test-secret"),
  INTERNAL_TOKEN: variavelComDefaultDeTeste("INTERNAL_TOKEN", "test-internal-token"),
  CORS_ORIGINS: z.string().default(DEFAULT_CORS_ORIGINS).transform(parseCorsOrigins),
  MINIO_ROOT_USER: z.string().optional(),
  MINIO_ROOT_PASSWORD: z.string().optional(),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_API_PORT: z.string().optional(),
  MINIO_CONSOLE_PORT: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(z.flattenError(parsedEnv.error).fieldErrors)}`,
  );
}

export const env = parsedEnv.data;
export const jwtSecretKey = env.JWT_SECRET_KEY;
