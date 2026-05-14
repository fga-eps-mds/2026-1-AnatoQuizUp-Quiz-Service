const envOriginal = process.env;

type StorageEnvOverrides = Partial<NodeJS.ProcessEnv>;
type MinioClientMock = {
  bucketExists: jest.Mock;
  makeBucket: jest.Mock;
  setBucketPolicy: jest.Mock;
};

function criarMinioMock(existeBucket = false): MinioClientMock {
  return {
    bucketExists: jest.fn().mockResolvedValue(existeBucket),
    makeBucket: jest.fn().mockResolvedValue(undefined),
    setBucketPolicy: jest.fn().mockResolvedValue(undefined),
  };
}

async function carregarStorage(
  overrides: StorageEnvOverrides = {},
  minioAdmin: MinioClientMock | undefined = criarMinioMock(),
) {
  jest.resetModules();

  process.env = {
    ...envOriginal,
    NODE_ENV: "test",
    MINIO_ENDPOINT: "http://localhost",
    MINIO_API_PORT: "9000",
    MINIO_ROOT_USER: "admin",
    MINIO_ROOT_PASSWORD: "senhaValida123",
    ...overrides,
  };

  global.__minio_native__ = minioAdmin as typeof global.__minio_native__;
  global.__s3_client__ = {} as typeof global.__s3_client__;

  return import("../../../src/config/storage");
}

describe("Storage Configuration", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = envOriginal;
  });

  it("configura o bucket quando o storage esta habilitado", async () => {
    const minioAdmin = criarMinioMock(false);
    const { configurarStorage } = await carregarStorage({}, minioAdmin);

    await configurarStorage();

    expect(minioAdmin.bucketExists).toHaveBeenCalledWith("anatoquizup-imagens");
    expect(minioAdmin.makeBucket).toHaveBeenCalledWith("anatoquizup-imagens");
    expect(minioAdmin.setBucketPolicy).toHaveBeenCalled();
  });

  it("usa a porta de API mesmo quando endpoint vier com porta de console", async () => {
    const { montarEndpointStorage } = await carregarStorage({
      NODE_ENV: "production",
      MINIO_ENDPOINT: "https://minio.example.com:9001",
      MINIO_API_PORT: "9000",
    });

    expect(montarEndpointStorage("https://minio.example.com:9001", "9000")).toEqual({
      hostname: "minio.example.com",
      port: 9000,
      useSSL: true,
      s3Endpoint: "https://minio.example.com:9000",
    });
  });

  it("pula configuracao local quando as variaveis do MinIO estao ausentes", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const { configurarStorage } = await carregarStorage({ MINIO_ENDPOINT: undefined });

    await configurarStorage();

    expect(warnSpy).toHaveBeenCalledWith(
      "[Storage] Variaveis do MinIO ausentes. Pulando configuracao local.",
    );
  });

  it("lanca erro em producao quando as variaveis do MinIO estao ausentes", async () => {
    const { configurarStorage } = await carregarStorage({
      NODE_ENV: "production",
      MINIO_ENDPOINT: undefined,
    });

    await expect(configurarStorage()).rejects.toThrow("Variaveis do MinIO nao configuradas");
  });

  it("lanca erro se a porta de API for invalida", async () => {
    const { configurarStorage } = await carregarStorage({ MINIO_API_PORT: "porta-invalida" });

    await expect(configurarStorage()).rejects.toThrow("MINIO_API_PORT invalida");
  });

  it("lanca erro se o MinIO falhar", async () => {
    const minioAdmin = criarMinioMock();
    minioAdmin.bucketExists.mockRejectedValue(new Error("Conexao recusada"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation();
    const { configurarStorage } = await carregarStorage({}, minioAdmin);

    await expect(configurarStorage()).rejects.toThrow("[Storage] Falha critica");
    expect(errorSpy).toHaveBeenCalled();
  });
});
