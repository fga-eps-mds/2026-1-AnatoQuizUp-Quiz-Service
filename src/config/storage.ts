import { S3Client } from "@aws-sdk/client-s3";
import * as Minio from "minio";

declare global {
  var __minio_native__: Minio.Client | undefined;
  var __s3_client__: S3Client | undefined;
}

const rawEndpoint = process.env.MINIO_ENDPOINT;
const accessKey = process.env.MINIO_ROOT_USER;
const secretKey = process.env.MINIO_ROOT_PASSWORD;
const apiPort = process.env.MINIO_API_PORT;

if (!rawEndpoint || !accessKey || !secretKey || !apiPort) {
  throw new Error("Erro: Variáveis do MinIO não configuradas.");
}

const isProduction = process.env.NODE_ENV === "production";

export function montarEndpointStorage(endpoint: string, portaApi: string) {
  const porta = Number(portaApi);

  if (!Number.isInteger(porta) || porta <= 0) {
    throw new Error("Erro: MINIO_API_PORT invalida.");
  }

  const endpointComProtocolo = /^https?:\/\//i.test(endpoint) ? endpoint : `http://${endpoint}`;
  const url = new URL(endpointComProtocolo);

  url.port = String(porta);
  url.pathname = "";
  url.search = "";
  url.hash = "";

  return {
    hostname: url.hostname,
    port: porta,
    useSSL: url.protocol === "https:",
    s3Endpoint: url.toString().replace(/\/$/, ""),
  };
}

export const minioEndpointConfig = montarEndpointStorage(rawEndpoint, apiPort);

export const minioAdmin =
  global.__minio_native__ ??
  new Minio.Client({
    endPoint: minioEndpointConfig.hostname,
    port: minioEndpointConfig.port,
    useSSL: minioEndpointConfig.useSSL,
    accessKey,
    secretKey,
  });

export const s3Client =
  global.__s3_client__ ??
  new S3Client({
    endpoint: minioEndpointConfig.s3Endpoint,
    region: "us-east-1",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });

if (!isProduction) {
  global.__minio_native__ = minioAdmin;
  global.__s3_client__ = s3Client;
}

export async function configurarStorage() {
  const bucketName = "anatoquizup-imagens";

  try {
    const existe = await minioAdmin.bucketExists(bucketName);

    if (!existe) {
      console.log(`[Storage] Criando bucket "${bucketName}"...`);
      await minioAdmin.makeBucket(bucketName);

      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["s3:GetObject"],
            Effect: "Allow",
            Principal: "*",
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };

      await minioAdmin.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`[Storage] Bucket "${bucketName}" configurado como público.`);
    } else {
      console.log(`[Storage] Infraestrutura pronta.`);
    }
  } catch (error) {
    console.error("[Storage] Erro detalhado:", error);
    throw new Error(`[Storage] Falha crítica: ${error}`);
  }
}
